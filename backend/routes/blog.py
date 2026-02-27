from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from database.config import get_async_db
from models.blog import BlogPost

router = APIRouter(tags=["blog"])


def _localized(post: BlogPost, base: str, lang: str) -> str:
    localized = getattr(post, f"{base}_{lang}", None)
    alt_lang = "en" if lang == "ru" else "ru"
    localized_alt = getattr(post, f"{base}_{alt_lang}", None)
    legacy = getattr(post, base, None)
    return (localized or localized_alt or legacy or "").strip()


@router.get("")
async def list_published_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=50),
    category: str = Query(None),
    search: str = Query(None),
    featured: bool = Query(None),
    lang: str = Query("en", pattern="^(ru|en)$"),
    db: AsyncSession = Depends(get_async_db),
):
    """List published blog posts (public endpoint)."""
    query = select(BlogPost).where(BlogPost.status == "published")

    conditions = []
    if category:
        conditions.append(BlogPost.category == category)
    if featured is not None:
        conditions.append(BlogPost.is_featured == featured)
    if search:
        term = f"%{search}%"
        conditions.append(
            or_(
                BlogPost.title.ilike(term),
                BlogPost.excerpt.ilike(term),
                BlogPost.title_ru.ilike(term),
                BlogPost.title_en.ilike(term),
                BlogPost.excerpt_ru.ilike(term),
                BlogPost.excerpt_en.ilike(term),
                BlogPost.tags.ilike(term),
            )
        )
    if conditions:
        query = query.where(and_(*conditions))

    total_q = select(func.count()).select_from(query.subquery())
    total = await db.scalar(total_q)

    rows = await db.execute(
        query.order_by(BlogPost.published_at.desc()).offset(skip).limit(limit)
    )
    posts = rows.scalars().all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [
            {
                "id": p.id,
                "title": _localized(p, "title", lang),
                "slug": p.slug,
                "excerpt": _localized(p, "excerpt", lang),
                "featured_image": p.featured_image,
                "featured_image_alt": p.featured_image_alt,
                "category": p.category,
                "tags": p.tags.split(",") if p.tags else [],
                "author_name": p.author_name,
                "author_bio": p.author_bio,
                "is_featured": p.is_featured,
                "view_count": p.view_count,
                "like_count": p.like_count,
                "reading_time": p.reading_time,
                "word_count": p.word_count,
                "published_at": p.published_at.isoformat() if p.published_at else None,
            }
            for p in posts
        ],
    }


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_async_db)):
    """Return categories with published post counts."""
    rows = await db.execute(
        select(BlogPost.category, func.count(BlogPost.id).label("count"))
        .where(BlogPost.status == "published")
        .group_by(BlogPost.category)
        .order_by(func.count(BlogPost.id).desc())
    )
    results = rows.all()
    total = sum(r.count for r in results)
    categories = [{"id": r.category, "name": r.category, "count": r.count} for r in results]
    return {"total": total, "categories": categories}


@router.get("/{slug}")
async def get_published_post(
    slug: str,
    lang: str = Query("en", pattern="^(ru|en)$"),
    db: AsyncSession = Depends(get_async_db),
):
    """Get a single published post by slug. Increments view count."""
    post = await db.scalar(
        select(BlogPost).where(
            BlogPost.slug == slug,
            BlogPost.status == "published",
        )
    )
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Increment view count
    post.view_count = (post.view_count or 0) + 1
    await db.commit()
    await db.refresh(post)

    # Fetch related posts (same category, excluding current)
    related_rows = await db.execute(
        select(BlogPost)
        .where(
            BlogPost.status == "published",
            BlogPost.category == post.category,
            BlogPost.id != post.id,
        )
        .order_by(BlogPost.published_at.desc())
        .limit(3)
    )
    related = related_rows.scalars().all()

    return {
        "id": post.id,
        "title": _localized(post, "title", lang),
        "slug": post.slug,
        "excerpt": _localized(post, "excerpt", lang),
        "content": _localized(post, "content", lang),
        "featured_image": post.featured_image,
        "featured_image_alt": post.featured_image_alt,
        "category": post.category,
        "tags": post.tags.split(",") if post.tags else [],
        "author_name": post.author_name,
        "author_email": post.author_email,
        "author_bio": post.author_bio,
        "is_featured": post.is_featured,
        "view_count": post.view_count,
        "like_count": post.like_count,
        "share_count": post.share_count,
        "reading_time": post.reading_time,
        "word_count": post.word_count,
        "published_at": post.published_at.isoformat() if post.published_at else None,
        "related": [
            {
                "id": r.id,
                "title": _localized(r, "title", lang),
                "slug": r.slug,
                "excerpt": _localized(r, "excerpt", lang),
                "featured_image": r.featured_image,
                "reading_time": r.reading_time,
                "published_at": r.published_at.isoformat() if r.published_at else None,
            }
            for r in related
        ],
    }
