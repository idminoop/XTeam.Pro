import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Share2, BookOpen, TrendingUp, Heart, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ApiPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  featured_image_alt: string | null;
  category: string;
  tags: string[];
  author_name: string;
  author_bio: string | null;
  view_count: number;
  like_count: number;
  share_count: number;
  reading_time: number | null;
  published_at: string | null;
  related: RelatedPost[];
}

interface RelatedPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  reading_time: number | null;
  published_at: string | null;
}

export default function BlogPost() {
  const { t, i18n } = useTranslation();
  const { id: slug } = useParams<{ id: string }>();
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('ru') ? 'ru' : 'en';
  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/blog/${slug}?lang=${lang}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setPost(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, lang]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(
      i18n.language === 'ru' ? 'ru-RU' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('blog.post.loading')}</p>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('blog.notFound.title')}</h1>
          <p className="text-gray-600 mb-6">{t('blog.notFound.message')}</p>
          <Link
            to="/blog"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('blog.notFound.backButton')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link to="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('blog.notFound.backButton')}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
                  {post.category}
                </span>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(post.published_at)}
                </div>
                {post.reading_time && (
                  <div className="flex items-center text-gray-500 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {post.reading_time} {t('blog.post.minRead')}
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>

              <div className="flex items-center justify-center space-x-6 text-gray-500 text-sm">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {post.view_count.toLocaleString()} {t('blog.post.views')}
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {post.like_count} {t('blog.post.likes')}
                </div>
              </div>
            </motion.div>

            {post.featured_image && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <img
                  src={post.featured_image}
                  alt={post.featured_image_alt ?? post.title}
                  className="w-full h-96 object-cover rounded-2xl shadow-lg"
                />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Article */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Content */}
              <div className="lg:w-3/4">
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg p-8 lg:p-12"
                >
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('blog.post.tags')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <span key={tag} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Author */}
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold shrink-0">
                        {post.author_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{post.author_name}</h3>
                        {post.author_bio && <p className="text-gray-600 mt-1">{post.author_bio}</p>}
                      </div>
                    </div>
                  </div>
                </motion.article>
              </div>

              {/* Sidebar */}
              <div className="lg:w-1/4">
                <div className="sticky top-8 space-y-8">
                  {/* Actions */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('blog.post.actions')}</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setIsLiked(!isLiked)}
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                          isLiked
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{isLiked ? t('blog.post.liked') : t('blog.post.like')}</span>
                      </button>

                      <button
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                          isBookmarked
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                        <span>{isBookmarked ? t('blog.post.saved') : t('blog.post.save')}</span>
                      </button>

                      <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                        <span>{t('blog.post.share')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Related Posts */}
                  {post.related.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('blog.post.relatedArticles')}</h3>
                      <div className="space-y-4">
                        {post.related.map(rel => (
                          <Link key={rel.id} to={`/blog/${rel.slug}`} className="block group">
                            <div className="flex space-x-3">
                              {rel.featured_image ? (
                                <img
                                  src={rel.featured_image}
                                  alt={rel.title}
                                  className="w-16 h-16 object-cover rounded-lg shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-blue-50 rounded-lg shrink-0 flex items-center justify-center">
                                  <BookOpen className="w-6 h-6 text-blue-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                  {rel.title}
                                </h4>
                                {rel.reading_time && (
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {rel.reading_time} {t('blog.post.min')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
