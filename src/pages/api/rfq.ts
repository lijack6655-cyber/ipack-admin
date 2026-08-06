import crypto from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Json } from '@/types/database';

const text = (value: unknown, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) || null : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!req.headers['content-type']?.includes('application/json')) return res.status(415).json({ error: 'JSON required' });
  if (JSON.stringify(req.body ?? {}).length > 30_000) return res.status(413).json({ error: 'Payload too large' });

  const body = req.body as Record<string, unknown>;
  if (text(body.website)) return res.status(202).json({ accepted: true });
  if (body.privacyConsent !== true) return res.status(400).json({ error: 'Privacy consent is required' });

  const name = text(body.name, 120);
  const contactValue = text(body.email, 254);
  const email = contactValue?.includes('@') ? contactValue : null;
  const whatsapp = text(body.whatsapp, 80) || (contactValue && !email ? contactValue : null);
  if (!name || (!email && !whatsapp)) return res.status(400).json({ error: 'Name and email or WhatsApp are required' });

  try {
    const salt = process.env.RFQ_FINGERPRINT_SALT;
    if (!salt) throw new Error('RFQ fingerprint salt is not configured');
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const fingerprint = crypto.createHash('sha256').update(`${salt}:${forwarded}:${email || whatsapp}`).digest('hex');
    const client = getSupabaseServerClient();
    const recentSince = new Date(Date.now() - 60_000).toISOString();
    const { count } = await client.from('inquiries').select('*', { count: 'exact', head: true }).eq('request_fingerprint', fingerprint).gte('created_at', recentSince);
    if ((count ?? 0) > 0) return res.status(202).json({ accepted: true, duplicate: true });

    const { data: contact, error: contactError } = await client.from('contacts').insert({
      name,
      email,
      whatsapp,
      phone: text(body.phone, 80),
      company: text(body.company, 160),
      country: text(body.country, 120),
      source: 'website_rfq',
      verification_status: 'imported_unverified',
    }).select('id').single();
    if (contactError) throw contactError;

    const safePayload: Json = {
      vehicle: text(body.vehicle, 240),
      parts_needed: text(body.parts_needed, 3000),
      pasted_image_summary: text(body.pasted_image_summary, 500),
    };
    const { data: inquiry, error: inquiryError } = await client.from('inquiries').insert({
      contact_id: contact.id,
      destination_country: text(body.country, 120),
      message: text(body.message, 4000) || text(body.parts_needed, 4000),
      oe_number: text(body.oe_number, 160),
      product_interest: text(body.product_interest, 500) || text(body.parts_needed, 500),
      quantity: text(body.quantity, 120),
      raw_payload: safePayload,
      request_fingerprint: fingerprint,
      selected_products: Array.isArray(body.selected_products) ? body.selected_products.slice(0, 50) as Json : null,
      source: 'website_rfq',
      source_page: text(body.sourcePage, 500),
      subject: text(body.subject, 240),
      privacy_consent: true,
      utm_campaign: text(body.utm_campaign, 160),
      utm_content: text(body.utm_content, 160),
      utm_medium: text(body.utm_medium, 160),
      utm_source: text(body.utm_source, 160),
      utm_term: text(body.utm_term, 160),
      vehicle_model: text(body.vehicle, 240),
    }).select('reference').single();
    if (inquiryError) throw inquiryError;
    return res.status(201).json({ accepted: true, reference: inquiry.reference });
  } catch (error) {
    console.error('RFQ API failed', error instanceof Error ? error.message : 'Unknown error');
    return res.status(503).json({ error: 'Inquiry storage temporarily unavailable' });
  }
}
