import { useRouter } from 'next/router';
import ArticleEditor from '@/components/articles/ArticleEditor';

export default function EditArticlePage() {
  const router = useRouter();
  return <ArticleEditor articleId={typeof router.query.id === 'string' ? router.query.id : undefined} />;
}
