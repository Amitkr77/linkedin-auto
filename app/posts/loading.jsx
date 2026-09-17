import { PostListSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div>
      <div className="page-header">
        <h1>All Posts</h1>
      </div>
      <PostListSkeleton />
    </div>
  );
}
