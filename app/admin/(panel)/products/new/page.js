import { getCategories } from '@/lib/queries';
import ProductForm from '@/components/admin/ProductForm';
import Banner from '@/components/admin/Banner';

export default async function NewProduct({ searchParams }) {
  const sp = await searchParams;
  return (
    <>
      <h1>Add product</h1>
      <Banner sp={sp} />
      <ProductForm categories={getCategories({ all: true })} />
    </>
  );
}
