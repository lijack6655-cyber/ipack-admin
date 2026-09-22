import type { Tables } from '@/types/database';
import { escapeHtml as h, type ProductInput } from './model';
import shell from './shell.json';

export function renderProduct(product: Tables<'products'>, form: ProductInput, options: { preview?: boolean; imageUrls?: Record<string,string> } = {}) {
  const url = `https://www.ipackautoparts.com/products/${encodeURIComponent(product.slug)}`;
  const imageUrl = (path: string) => options.imageUrls?.[path] || `https://www.ipackautoparts.com/${path.replace(/^\//,'')}`;
  const images = form.images.map((image,index) => `<img src="${h(imageUrl(image.path))}" alt="${h(image.alt || form.title)}" ${index ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" style="width:100%;aspect-ratio:1;object-fit:contain;background:white;border:1px solid #e2e8f0;border-radius:12px">`);
  const facts = [['Vehicle',[form.make,form.model].filter(Boolean).join(' ')],['Years',form.years],['OE Number',form.oe_numbers.join(', ')],['MOQ',form.moq_text || 'Contact us'],['Price',form.price_text || 'Request a quote']].filter(([,value]) => value);
  const schema = { '@context':'https://schema.org', '@type':'Product', name:form.title, sku:form.sku, description:form.short_description || form.description.slice(0,1000), image:form.images.map(i => imageUrl(i.path)), url };
  const formHtml = shell.form.replace(/(name="product" value=")[^"]*"/, (_, prefix: string) => `${prefix}${h(form.title)}"`).replace(/(name="oe_number"[^>]*value=")[^"]*"/, (_, prefix: string) => `${prefix}${h(form.oe_numbers.join(', '))}"`);
  const header = shell.header.replace('<a href="/products">Products</a>', '<a href="/product">Product</a><a href="/products">Search</a>');
  const catalogFooter = shell.footer.replace('<a href="/products">Product Catalog</a>', '<a href="/product">Product Catalog</a>');
  const footer = options.preview ? catalogFooter.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'') : catalogFooter.replace(/main\.js\?v=20260908-leads/g,'main.js?v=20260922-product');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${h(form.seo_title || form.title)} | I-PACK Auto Parts</title><meta name="description" content="${h(form.seo_description || form.short_description || form.description.slice(0,160))}">
${options.preview ? '<meta name="robots" content="noindex,nofollow">' : `<link rel="canonical" href="${h(url)}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`}
<link rel="stylesheet" href="https://www.ipackautoparts.com/assets/css/styles.css"></head>${header.replace(/src="\/assets\//g,'src="https://www.ipackautoparts.com/assets/')}
${options.preview ? '<div style="padding:12px;background:#fff3cd;text-align:center">Draft preview — not published</div>' : ''}
<main><section class="page-hero"><div class="container"><div class="breadcrumb"><a href="/">Home</a> / <a href="/product">Product</a></div><h1>${h(form.title)}</h1><p>${h(form.short_description)}</p></div></section>
<section class="section"><div class="container grid-2"><div>${images[0] || '<p>Product image pending</p>'}<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px">${images.slice(1).join('')}</div></div>
<div><h2>Product Information</h2><div class="kv-grid">${facts.map(([label,value]) => `<div class="kv"><strong>${h(label)}</strong>${h(value)}</div>`).join('')}</div>
<p style="margin-top:24px"><button class="btn" data-add-inquiry data-id="${h(product.external_id || product.id)}" data-title="${h(form.title)}" data-category="${h(product.category_name)}" data-oe="${h(form.oe_numbers.join(', '))}" data-url="/products/${h(product.slug)}">Add to RFQ</button> <a class="btn btn-light" href="#product-rfq">Request a Quote</a></p></div></div></section>
<section class="section light"><div class="container grid-2"><div class="content"><h2>Product Description</h2>${form.description.split(/\n\s*\n/).map(p => `<p style="white-space:pre-line;overflow-wrap:anywhere">${h(p)}</p>`).join('')}
${form.specifications.length ? `<h2>Specifications</h2><div class="table-wrap"><table><tbody>${form.specifications.map(s => `<tr><th>${h(s.name)}</th><td>${h(s.value)}</td></tr>`).join('')}</tbody></table></div>` : ''}</div>
<div id="product-rfq" class="quote-list-panel"><h2>Request Quote for This Product</h2>${options.preview ? '<p>RFQ form available on the published page.</p>' : formHtml}</div></div></section></main>${footer.replace(/src="\/assets\//g,'src="https://www.ipackautoparts.com/assets/')}</body></html>`;
}
