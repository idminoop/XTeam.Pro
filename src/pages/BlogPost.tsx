import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Share2, BookOpen, TrendingUp, MessageCircle, Heart, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    bio: string;
  };
  publishedAt: string;
  readTime: number;
  category: string;
  tags: string[];
  image: string;
  views: number;
  likes: number;
  comments: number;
}

interface RelatedPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  readTime: number;
  publishedAt: string;
}

export default function BlogPost() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - in real app, this would come from API
  const mockPosts: { [key: string]: BlogPost } = {
    'ai-transformation-manufacturing': {
      id: 'ai-transformation-manufacturing',
      title: 'How AI Transformed Manufacturing Operations at TechCorp: A Complete Case Study',
      content: `
        <h2>Executive Summary</h2>
        <p>TechCorp, a mid-sized manufacturing company, faced significant challenges with production efficiency, quality control, and operational costs. Through a strategic AI implementation over 18 months, they achieved remarkable results:</p>
        <ul>
          <li>35% reduction in production costs</li>
          <li>50% increase in operational efficiency</li>
          <li>90% improvement in quality control accuracy</li>
          <li>60% reduction in equipment downtime</li>
        </ul>

        <h2>The Challenge</h2>
        <p>TechCorp's manufacturing operations were plagued by several critical issues that were impacting their competitiveness and profitability:</p>
        
        <h3>1. Inefficient Production Planning</h3>
        <p>Manual production scheduling led to frequent bottlenecks and resource misallocation. The planning team spent 40+ hours weekly creating schedules that were often outdated within days.</p>
        
        <h3>2. Quality Control Issues</h3>
        <p>Traditional quality inspection methods caught only 70% of defects, leading to costly recalls and customer dissatisfaction. The manual inspection process was also time-consuming and inconsistent.</p>
        
        <h3>3. Unpredictable Equipment Failures</h3>
        <p>Reactive maintenance resulted in unexpected downtime costing $50,000 per incident. With 15-20 incidents monthly, this represented a significant operational expense.</p>

        <h2>The AI Solution</h2>
        <p>Working with XTeam.Pro, TechCorp implemented a comprehensive AI strategy across three key areas:</p>
        
        <h3>1. Intelligent Production Planning</h3>
        <p>We deployed an AI-powered production planning system that:</p>
        <ul>
          <li>Analyzes historical production data and current orders</li>
          <li>Optimizes resource allocation in real-time</li>
          <li>Predicts and prevents potential bottlenecks</li>
          <li>Automatically adjusts schedules based on changing priorities</li>
        </ul>
        
        <h3>2. Computer Vision Quality Control</h3>
        <p>Implementation of advanced computer vision systems for:</p>
        <ul>
          <li>Real-time defect detection with 99.5% accuracy</li>
          <li>Automated sorting and classification</li>
          <li>Continuous quality monitoring throughout production</li>
          <li>Detailed quality analytics and reporting</li>
        </ul>
        
        <h3>3. Predictive Maintenance</h3>
        <p>IoT sensors and machine learning algorithms enable:</p>
        <ul>
          <li>Real-time equipment health monitoring</li>
          <li>Predictive failure analysis</li>
          <li>Optimized maintenance scheduling</li>
          <li>Parts inventory optimization</li>
        </ul>

        <h2>Implementation Timeline</h2>
        <p>The transformation was executed in three phases over 18 months:</p>
        
        <h3>Phase 1: Assessment and Planning (Months 1-3)</h3>
        <ul>
          <li>Comprehensive operational audit</li>
          <li>Data infrastructure setup</li>
          <li>Team training and change management</li>
          <li>Pilot program design</li>
        </ul>
        
        <h3>Phase 2: Core System Implementation (Months 4-12)</h3>
        <ul>
          <li>Production planning AI deployment</li>
          <li>Computer vision system installation</li>
          <li>IoT sensor network setup</li>
          <li>Integration with existing systems</li>
        </ul>
        
        <h3>Phase 3: Optimization and Scaling (Months 13-18)</h3>
        <ul>
          <li>System fine-tuning and optimization</li>
          <li>Advanced analytics implementation</li>
          <li>Full-scale deployment across all facilities</li>
          <li>Performance monitoring and continuous improvement</li>
        </ul>

        <h2>Results and ROI</h2>
        <p>The AI transformation delivered exceptional results across all key metrics:</p>
        
        <h3>Financial Impact</h3>
        <ul>
          <li><strong>$2.1M annual cost savings</strong> from improved efficiency</li>
          <li><strong>$800K reduction</strong> in quality-related costs</li>
          <li><strong>$600K savings</strong> from predictive maintenance</li>
          <li><strong>ROI of 340%</strong> achieved within 24 months</li>
        </ul>
        
        <h3>Operational Improvements</h3>
        <ul>
          <li><strong>50% faster</strong> production planning process</li>
          <li><strong>99.5% quality</strong> control accuracy</li>
          <li><strong>60% reduction</strong> in unplanned downtime</li>
          <li><strong>35% increase</strong> in overall equipment effectiveness</li>
        </ul>

        <h2>Key Success Factors</h2>
        <p>Several factors contributed to the success of this transformation:</p>
        
        <h3>1. Leadership Commitment</h3>
        <p>Strong executive sponsorship and clear communication of benefits ensured organization-wide buy-in and resource allocation.</p>
        
        <h3>2. Data Quality</h3>
        <p>Investment in data infrastructure and governance provided the foundation for accurate AI insights and predictions.</p>
        
        <h3>3. Change Management</h3>
        <p>Comprehensive training programs and gradual implementation helped employees adapt to new AI-powered workflows.</p>
        
        <h3>4. Continuous Optimization</h3>
        <p>Regular performance monitoring and system refinements ensured sustained improvements and ROI growth.</p>

        <h2>Lessons Learned</h2>
        <p>Key insights from TechCorp's AI transformation journey:</p>
        
        <ul>
          <li><strong>Start with clear objectives:</strong> Define specific, measurable goals before beginning implementation</li>
          <li><strong>Invest in data quality:</strong> Clean, structured data is essential for AI success</li>
          <li><strong>Plan for change management:</strong> Employee adoption is critical for realizing AI benefits</li>
          <li><strong>Think long-term:</strong> AI transformation is a journey, not a destination</li>
          <li><strong>Measure and optimize:</strong> Continuous monitoring enables ongoing improvements</li>
        </ul>

        <h2>Future Roadmap</h2>
        <p>Building on this success, TechCorp is now exploring:</p>
        <ul>
          <li>Supply chain optimization with AI</li>
          <li>Customer demand forecasting</li>
          <li>Energy consumption optimization</li>
          <li>Advanced robotics integration</li>
        </ul>

        <h2>Conclusion</h2>
        <p>TechCorp's AI transformation demonstrates the tremendous potential for manufacturing companies to leverage artificial intelligence for competitive advantage. With the right strategy, implementation approach, and partner, similar results are achievable across various industries.</p>
        
        <p>The key is to start with a clear vision, invest in the necessary infrastructure, and maintain focus on continuous improvement. As AI technology continues to evolve, companies that embrace these capabilities today will be best positioned for future success.</p>
      `,
      author: {
        name: 'Sarah Chen',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20headshot%20of%20Asian%20woman%20CEO%20in%20business%20attire%2C%20confident%20smile&image_size=square',
        role: 'CEO & Co-Founder',
        bio: 'Sarah is the CEO and Co-Founder of XTeam.Pro with over 15 years of experience in AI strategy and digital transformation. She has led successful AI implementations across Fortune 500 companies.'
      },
      publishedAt: '2024-01-15',
      readTime: 8,
      category: 'case-studies',
      tags: ['Manufacturing', 'AI Implementation', 'ROI', 'Process Optimization'],
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20manufacturing%20facility%20with%20AI%20robots%20and%20automated%20systems%2C%20high%20tech%20industrial%20setting&image_size=landscape_16_9',
      views: 2847,
      likes: 156,
      comments: 23
    }
  };

  const mockRelatedPosts: RelatedPost[] = [
    {
      id: 'future-of-ai-business',
      title: 'The Future of AI in Business: 10 Trends That Will Shape 2024',
      excerpt: 'Explore the emerging AI trends that will revolutionize business operations.',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Futuristic%20business%20office%20with%20AI%20holographic%20displays&image_size=landscape_4_3',
      readTime: 6,
      publishedAt: '2024-01-12'
    },
    {
      id: 'automation-roi-calculator',
      title: 'Building an ROI Calculator for Process Automation',
      excerpt: 'Learn how to create a comprehensive ROI calculator for automation initiatives.',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Business%20dashboard%20with%20ROI%20calculations%20and%20financial%20charts&image_size=landscape_4_3',
      readTime: 12,
      publishedAt: '2024-01-10'
    },
    {
      id: 'ai-customer-service',
      title: 'Revolutionizing Customer Service with AI',
      excerpt: 'Discover how leading companies are using AI to enhance customer experiences.',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20customer%20service%20center%20with%20AI%20chatbot%20interfaces&image_size=landscape_4_3',
      readTime: 7,
      publishedAt: '2024-01-08'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      if (id && mockPosts[id]) {
        setPost(mockPosts[id]);
        setRelatedPosts(mockRelatedPosts);
      }
      setLoading(false);
    }, 500);
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('blog.post.loading')}</p>
        </div>
      </div>
    );
  }

  if (!post) {
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('blog.notFound.backButton')}
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center space-x-4 mb-6">
                <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium capitalize">
                  {post.category.replace('-', ' ')}
                </span>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(post.publishedAt)}
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  {post.readTime} {t('blog.post.minRead')}
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>
              
              <div className="flex items-center justify-center space-x-6 text-gray-500 text-sm">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {post.views.toLocaleString()} {t('blog.post.views')}
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {post.likes} {t('blog.post.likes')}
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {post.comments} {t('blog.post.comments')}
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Main Content */}
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
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('blog.post.tags')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Author Bio */}
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex items-start space-x-4">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{post.author.name}</h3>
                        <p className="text-blue-600 font-medium mb-2">{post.author.role}</p>
                        <p className="text-gray-600">{post.author.bio}</p>
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
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('blog.post.relatedArticles')}</h3>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => (
                        <Link
                          key={relatedPost.id}
                          to={`/blog/${relatedPost.id}`}
                          className="block group"
                        >
                          <div className="flex space-x-3">
                            <img
                              src={relatedPost.image}
                              alt={relatedPost.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {relatedPost.title}
                              </h4>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {relatedPost.readTime} {t('blog.post.min')}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
