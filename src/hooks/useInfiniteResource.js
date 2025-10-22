import { useEffect, useRef, useState } from "react";

export function useInfiniteResource(fetcher, { limit = 10, onError }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const load = async (pageParam = page) => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const res = await fetcher(pageParam, limit);
      if (pageParam === 1) setItems(res.data);
      else setItems((prev) => [...prev, ...res.data]);
      setTotal(res.total || 0);
      setHasMore(res.data.length >= limit);
      setPage((p) => p + 1);
    } catch (err) {
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = async () => {
    setPage(1);
    setHasMore(true);
    await load(1);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading) load();
      },
      { threshold: 1 }
    );
    const current = sentinelRef.current;
    if (current) observer.observe(current);
    return () => current && observer.unobserve(current);
  }, [sentinelRef, hasMore, isLoading]);

  useEffect(() => {
    load(1);
  }, []);

  return { items, total, isLoading, hasMore, reset, sentinelRef };
}
