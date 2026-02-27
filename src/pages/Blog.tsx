import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, ArrowRight, Clock, TrendingUp, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildContactPath } from '@/utils/contactQuery';

interface ApiPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  featured_image_alt: string | null;
  category: string;
  tags: string[];
  author_name: string;
  is_featured: boolean;
  view_count: number;
  reading_time: number | null;
  published_at: string | null;
}

interface ApiListResponse {
  total: number;
  items: ApiPost[];
}

interface Category {
  id: string;
  name: string;
  count: number;
}

export default function Blog() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('ru') ? 'ru' : 'en';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 12;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ skip: String(page * limit), limit: String(limit), lang });
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory) params.set('category', selectedCategory);

      const res = await fetch(`/api/blog?${params}`);
      if (!res.ok) throw new Error('Failed');
      const data: ApiListResponse = await res.json();

      let items = data.items;
      if (sortBy === 'popular') items = [...items].sort((a, b) => b.view_count - a.view_count);
      else if (sortBy === 'oldest') items = [...items].sort((a, b) =>
        new Date(a.published_at ?? 0).getTime() - new Date(b.published_at ?? 0).getTime()
      );

      setPosts(items);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCategory, sortBy, lang]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/blog/categories');
      if (!res.ok) return;
      const data = await res.json();
      const all: Category = { id: '', name: t('blog.categories.all'), count: data.total };
      setCategories([all, ...data.categories.map((c: any) => ({ id: c.id, name: c.name, count: c.count }))]);
    } catch {
      setCategories([{ id: '', name: t('blog.categories.all'), count: 0 }]);
    }
  }, [t]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { setPage(0); }, [searchTerm, selectedCategory, sortBy, lang]);

  const featuredPosts = posts.filter(p => p.is_featured);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const locale = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('ru') ? 'ru-RU' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">{t('blog.title')}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">{t('blog.subtitle')}</p>
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      {!loading && featuredPosts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">{t('blog.featuredArticles')}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {featuredPosts.slice(0, 2).map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
                  >
                    {post.featured_image && (
                      <div className="relative">
                        <img
                          src={post.featured_image}
                          alt={post.featured_image_alt ?? post.title}
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {t('blog.featured')}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-8">
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                          {post.category}
                        </span>
                        {post.reading_time && (
                          <div className="flex items-center text-gray-500 text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {post.reading_time} {t('blog.minRead')}
                          </div>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
                        <Link to={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                          {post.title}
                        </Link>
                      </h3>
                      {post.excerpt && <p className="text-gray-600 mb-6 line-clamp-3">{post.excerpt}</p>}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{post.author_name}</p>
                          <p className="text-sm text-gray-500">{formatDate(post.published_at)}</p>
                        </div>
                        <Link
                          to={`/blog/${post.slug}`}
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {t('blog.readMore')}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Search and Filters + All Posts */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-gray-50 rounded-2xl p-6 sticky top-8">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('blog.searchArticles')}</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={t('blog.searchPlaceholder')}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('blog.categoriesTitle')}</h3>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{cat.name}</span>
                          <span className={`text-sm ${selectedCategory === cat.id ? 'text-blue-200' : 'text-gray-500'}`}>
                            {cat.count}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('blog.sortByTitle')}</h3>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="latest">{t('blog.sortBy.latest')}</option>
                    <option value="oldest">{t('blog.sortBy.oldest')}</option>
                    <option value="popular">{t('blog.sortBy.popular')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Posts grid */}
            <div className="lg:w-3/4">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  {t('blog.allArticles')}
                  <span className="text-lg font-normal text-gray-500 ml-2">
                    ({total} {total === 1 ? t('blog.article') : t('blog.articles')})
                  </span>
                </h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('blog.noArticlesFound')}</h3>
                  <p className="text-gray-600">{t('blog.tryAdjusting')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {posts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      {post.featured_image && (
                        <div className="relative">
                          <img
                            src={post.featured_image}
                            alt={post.featured_image_alt ?? post.title}
                            className="w-full h-48 object-cover"
                          />
                          {post.is_featured && (
                            <div className="absolute top-4 left-4">
                              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                {t('blog.featured')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                            {post.category}
                          </span>
                          <div className="flex items-center text-gray-500 text-sm">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {post.view_count.toLocaleString()} {t('blog.viewsText')}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                          <Link to={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                            {post.title}
                          </Link>
                        </h3>
                        {post.excerpt && <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{post.author_name}</p>
                            <div className="flex items-center text-gray-500 text-xs mt-0.5">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(post.published_at)}
                              {post.reading_time && (
                                <>
                                  <span className="mx-2">•</span>
                                  <Clock className="w-3 h-3 mr-1" />
                                  {post.reading_time} {t('blog.min')}
                                </>
                              )}
                            </div>
                          </div>
                          <Link
                            to={`/blog/${post.slug}`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            {t('blog.read')}
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {total > limit && (
                <div className="flex justify-center gap-3 mt-10">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page + 1) * limit >= total}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white max-w-2xl mx-auto"
          >
            <h2 className="text-4xl font-bold mb-4">{t('blog.newsletter.title')}</h2>
            <p className="text-xl mb-8 opacity-90">{t('blog.newsletter.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={t('blog.newsletter.placeholder')}
                className="flex-1 px-6 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Link
                to={buildContactPath({ source: 'blog_subscribe' })}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                {t('blog.newsletter.subscribe')}
              </Link>
            </div>
            <p className="text-sm opacity-75 mt-4">{t('blog.newsletter.privacy')}</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
