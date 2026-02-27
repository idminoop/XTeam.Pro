import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Globe, FileText } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import BlogEditor from '@/components/admin/BlogEditor';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import { adminApiJson } from '@/utils/adminApi';

interface BlogPostFull {
  id?: number;
  title_ru: string;
  title_en: string;
  slug: string;
  excerpt_ru: string;
  excerpt_en: string;
  content_ru: string;
  content_en: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  featured_image: string;
  featured_image_alt: string;
  category: string;
  tags: string;
  author_name: string;
  author_email: string;
  author_bio: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  allow_comments: boolean;
  is_seo_optimized: boolean;
}

type BlogPostApiResponse = Partial<BlogPostFull> & { id?: number };

const EMPTY_POST: BlogPostFull = {
  title_ru: '',
  title_en: '',
  slug: '',
  excerpt_ru: '',
  excerpt_en: '',
  content_ru: '',
  content_en: '',
  meta_title: '',
  meta_description: '',
  keywords: '',
  featured_image: '',
  featured_image_alt: '',
  category: 'AI',
  tags: '',
  author_name: '',
  author_email: '',
  author_bio: '',
  status: 'draft',
  is_featured: false,
  allow_comments: true,
  is_seo_optimized: false,
};

const CATEGORIES = ['AI', 'Automation', 'Case Studies', 'Industry Insights'];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className ?? ''}`}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
function Textarea(props: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${props.className ?? ''}`}
    />
  );
}

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authToken = useAdminStore(state => state.authToken);

  const isNew = !id || id === 'new';

  const [post, setPost] = useState<BlogPostFull>(EMPTY_POST);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');
  const [activeLanguage, setActiveLanguage] = useState<'ru' | 'en'>('ru');
  const [slugLocked, setSlugLocked] = useState(!isNew);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const mediaPickerCallbackRef = useRef<((url: string, alt: string) => void) | null>(null);

  const handleOpenMediaPicker = useCallback((onSelect: (url: string, alt: string) => void) => {
    mediaPickerCallbackRef.current = onSelect;
    setMediaPickerOpen(true);
  }, []);

  const handleMediaSelect = useCallback((url: string, alt: string) => {
    mediaPickerCallbackRef.current?.(url, alt);
    mediaPickerCallbackRef.current = null;
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      try {
        const data = await adminApiJson<BlogPostApiResponse>(`/api/admin/blog/${id}`, authToken);
        setPost({
          id: data.id,
          title_ru: data.title_ru ?? '',
          title_en: data.title_en ?? '',
          slug: data.slug ?? '',
          excerpt_ru: data.excerpt_ru ?? '',
          excerpt_en: data.excerpt_en ?? '',
          content_ru: data.content_ru ?? '',
          content_en: data.content_en ?? '',
          meta_title: data.meta_title ?? '',
          meta_description: data.meta_description ?? '',
          keywords: data.keywords ?? '',
          featured_image: data.featured_image ?? '',
          featured_image_alt: data.featured_image_alt ?? '',
          category: data.category ?? 'AI',
          tags: data.tags ?? '',
          author_name: data.author_name ?? '',
          author_email: data.author_email ?? '',
          author_bio: data.author_bio ?? '',
          status: data.status ?? 'draft',
          is_featured: data.is_featured ?? false,
          allow_comments: data.allow_comments ?? true,
          is_seo_optimized: data.is_seo_optimized ?? false,
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [authToken, id, isNew]);

  const set = (key: keyof BlogPostFull, value: any) => {
    setPost(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'title_en' && !slugLocked) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const validate = () => {
    if (!post.title_ru.trim() || !post.title_en.trim()) return 'Both title_ru and title_en are required';
    if (!post.excerpt_ru.trim() || !post.excerpt_en.trim()) return 'Both excerpt_ru and excerpt_en are required';
    if (!post.content_ru.trim() || post.content_ru.trim() === '<p></p>') return 'content_ru is required';
    if (!post.content_en.trim() || post.content_en.trim() === '<p></p>') return 'content_en is required';
    if (!post.category) return 'Category is required';
    if (!post.author_name.trim()) return 'Author name is required';
    return null;
  };

  const handleSave = async (overrideStatus?: 'draft' | 'published') => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      ...post,
      status: overrideStatus ?? post.status,
    };

    try {
      const url = isNew ? '/api/admin/blog' : `/api/admin/blog/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      const data = await adminApiJson<{ id?: number }>(url, authToken, {
        method,
        body: JSON.stringify(payload),
      });
      if (isNew && data.id) {
        navigate(`/admin/blog/${data.id}/edit`, { replace: true });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/blog" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">{isNew ? 'New Post' : 'Edit Post'}</h1>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </a>
          )}
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Globe className="w-4 h-4" />
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Title (RU)">
                <Input value={post.title_ru} onChange={e => set('title_ru', e.target.value)} placeholder="Заголовок на русском" className="text-base font-semibold" />
              </Field>
              <Field label="Title (EN)">
                <Input value={post.title_en} onChange={e => set('title_en', e.target.value)} placeholder="Title in English" className="text-base font-semibold" />
              </Field>
            </div>

            <Field label="Slug" hint="URL-friendly identifier. Auto-generated from English title.">
              <div className="flex gap-2">
                <Input
                  value={post.slug}
                  onChange={e => set('slug', e.target.value)}
                  placeholder="post-url-slug"
                  readOnly={slugLocked}
                  className={slugLocked ? 'bg-gray-50 cursor-not-allowed' : ''}
                />
                <button type="button" onClick={() => setSlugLocked(value => !value)} className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 shrink-0">
                  {slugLocked ? 'Unlock' : 'Lock'}
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Excerpt (RU)">
                <Textarea value={post.excerpt_ru} onChange={e => set('excerpt_ru', e.target.value)} rows={3} />
              </Field>
              <Field label="Excerpt (EN)">
                <Textarea value={post.excerpt_en} onChange={e => set('excerpt_en', e.target.value)} rows={3} />
              </Field>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {(['content', 'seo', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => setActiveLanguage('ru')}
                      className={`px-3 py-1.5 text-sm ${activeLanguage === 'ru' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                      RU
                    </button>
                    <button
                      onClick={() => setActiveLanguage('en')}
                      className={`px-3 py-1.5 text-sm ${activeLanguage === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                      EN
                    </button>
                  </div>

                  {activeLanguage === 'ru' ? (
                    <BlogEditor
                      content={post.content_ru}
                      onChange={html => set('content_ru', html)}
                      placeholder="Пишите текст статьи на русском..."
                      onOpenMediaPicker={handleOpenMediaPicker}
                    />
                  ) : (
                    <BlogEditor
                      content={post.content_en}
                      onChange={html => set('content_en', html)}
                      placeholder="Write article content in English..."
                      onOpenMediaPicker={handleOpenMediaPicker}
                    />
                  )}
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <Field label="Meta Title" hint="Defaults to English title if left empty.">
                    <Input value={post.meta_title} onChange={e => set('meta_title', e.target.value)} placeholder="SEO title" maxLength={70} />
                    <p className="text-xs text-gray-400 mt-1">{post.meta_title.length}/70</p>
                  </Field>
                  <Field label="Meta Description">
                    <Textarea value={post.meta_description} onChange={e => set('meta_description', e.target.value)} rows={3} maxLength={160} />
                    <p className="text-xs text-gray-400 mt-1">{post.meta_description.length}/160</p>
                  </Field>
                  <Field label="Keywords" hint="Comma-separated keywords.">
                    <Input value={post.keywords} onChange={e => set('keywords', e.target.value)} placeholder="automation, ai, business" />
                  </Field>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={post.is_seo_optimized} onChange={e => set('is_seo_optimized', e.target.checked)} className="rounded" />
                    Mark as SEO-optimized
                  </label>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={post.is_featured} onChange={e => set('is_featured', e.target.checked)} className="rounded" />
                    Featured post
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={post.allow_comments} onChange={e => set('allow_comments', e.target.checked)} className="rounded" />
                    Allow comments
                  </label>
                  <Field label="Status">
                    <select
                      value={post.status}
                      onChange={e => set('status', e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </Field>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Publish</h3>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
              post.status === 'published' ? 'bg-green-100 text-green-700' : post.status === 'archived' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {post.status}
            </span>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Categorization</h3>
            <Field label="Category">
              <select
                value={post.category}
                onChange={e => set('category', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tags" hint="Comma-separated tags.">
              <Input value={post.tags} onChange={e => set('tags', e.target.value)} placeholder="automation, ai, strategy" />
            </Field>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Featured Image</h3>
            <Field label="Image URL">
              <Input value={post.featured_image} onChange={e => set('featured_image', e.target.value)} placeholder="https://..." />
            </Field>
            {post.featured_image && (
              <img
                src={post.featured_image}
                alt={post.featured_image_alt || 'Featured image preview'}
                className="w-full h-36 object-cover rounded-lg border border-gray-200"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <Field label="Alt Text">
              <Input value={post.featured_image_alt} onChange={e => set('featured_image_alt', e.target.value)} placeholder="Descriptive alt text" />
            </Field>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Author</h3>
            <Field label="Name">
              <Input value={post.author_name} onChange={e => set('author_name', e.target.value)} placeholder="Author name" />
            </Field>
            <Field label="Email">
              <Input type="email" value={post.author_email} onChange={e => set('author_email', e.target.value)} placeholder="author@example.com" />
            </Field>
            <Field label="Bio">
              <Textarea value={post.author_bio} onChange={e => set('author_bio', e.target.value)} rows={3} />
            </Field>
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
