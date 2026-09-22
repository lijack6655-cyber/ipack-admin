import assert from 'node:assert/strict';
import { emptyProduct, inspectionIssues } from '../src/lib/products/model.ts';

assert.deepEqual(inspectionIssues(emptyProduct), [
  '产品名称', 'SKU', '产品分类', '产品主图', '产品描述', '资料核验说明',
]);
assert.deepEqual(inspectionIssues({ ...emptyProduct, title: ' ', sku: ' ', description: ' ', verification_note: ' ' }), [
  '产品名称', 'SKU', '产品分类', '产品主图', '产品描述', '资料核验说明',
]);

const invalidSpecifications = inspectionIssues({
  ...emptyProduct,
  title: 'Test product',
  sku: 'TEST-001',
  category_id: '00000000-0000-0000-0000-000000000000',
  images: [{ path: '/assets/images/test.webp', alt: '' }],
  description: 'Test description',
  verification_note: 'Checked',
  specifications: [{ name: '', value: '' }, { name: '', value: '' }],
});
assert.deepEqual(invalidSpecifications, ['产品规格格式或长度有误']);

console.log('product inspection checks passed');
