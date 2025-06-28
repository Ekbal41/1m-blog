const { generateSlug } = require("../utils/helpers");
const AppError = require("../utils/appError");
const prisma = require("../config/prisma");

exports.createPost = async (req, res, next) => {
  /* #swagger.tags = ['Post']*/
  try {
    const { title, content, categoryIds = [], published = false } = req.body;
    const authorId = req.user.id;
    const slug = generateSlug(title);
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    });

    if (existingPost) {
      return next(AppError.conflict("A post exist with same name."));
    }

    if (categoryIds.length > 0) {
      const existingCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      if (existingCategories.length !== categoryIds.length) {
        const missingIds = categoryIds.filter(
          (id) => !existingCategories.some((cat) => cat.id === id)
        );
        throw new AppError(`Categories not found: ${missingIds.join(", ")}`);
      }
    }

    const excerpt =
      content.substring(0, 150) + (content.length > 150 ? "..." : "");

    const post = await prisma.$transaction(async (tx) => {
      const newPost = await tx.post.create({
        data: {
          title,
          slug,
          content,
          excerpt,
          authorId,
          published,
          ...(published && { publishedAt: new Date() }),
          ...(categoryIds.length > 0 && {
            categories: {
              connect: categoryIds.map((id) => ({ id })),
            },
          }),
        },
        include: {
          categories: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return newPost;
    });

    res.status(201).json({
      status: "success",
      post,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllPosts = async (req, res, next) => {
  /* #swagger.tags = ['Post']*/
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
      published,
      authorId,
      author,
      category,
      categoryName,
      search,
      minComments,
      maxComments,
      dateFrom,
      dateTo,
    } = req.query;

    const where = {
      // Published status filter
      ...(published !== undefined && {
        published: published === "true",
      }),

      // Author filters
      ...(authorId && { authorId }),

      ...(author && {
        author: {
          name: {
            contains: author,
            mode: "insensitive",
          },
        },
      }),

      // Category filters
      ...(category && {
        categories: {
          some: { id: category },
        },
      }),
      ...(categoryName && {
        categories: {
          some: {
            name: {
              contains: categoryName,
              mode: "insensitive",
            },
          },
        },
      }),

      // Search in title/content
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      }),

      // Comment count range
      ...((minComments || maxComments) && {
        comments: {
          ...(minComments && { gte: parseInt(minComments) }),
          ...(maxComments && { lte: parseInt(maxComments) }),
        },
      }),

      // Date range
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    };

    const total = await prisma.post.count({ where });

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    res.status(200).json({
      status: "success",
      results: posts.length,
      posts,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  /* #swagger.tags = ['Post']*/
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: true,
        comments: {
          take: 10,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return next(AppError.notFound("Post not found."));
    }

    // Increment view count
    await prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    res.status(200).json({
      status: "success",
      post,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPostBySlug = async (req, res, next) => {
  /* #swagger.tags = ['Post']*/
  try {
    const { slug } = req.params;

    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: true,
        comments: {
          take: 10,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return next(AppError.notFound("Post not found."));
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    res.status(200).json({
      status: "success",
      post,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  /* #swagger.tags = ['Post']*/
  try {
    const { id } = req.params;
    const { title, content, categoryIds, published } = req.body;

    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingPost) {
      return next(AppError.notFound("Post not found."));
    }

    if (existingPost.authorId !== req.user.id) {
      return next(AppError.forbidden());
    }

    const updateData = {
      ...(title && { title }),
      ...(content && {
        content,
        excerpt: content.substring(0, 150) + "...",
      }),
      ...(typeof published === "boolean" && {
        published,
        ...(published &&
          !existingPost.publishedAt && { publishedAt: new Date() }),
      }),
    };

    const post = await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: updateData,
      });

      if (categoryIds) {
        await tx.post.update({
          where: { id },
          data: {
            categories: {
              set: categoryIds.map((id) => ({ id })),
            },
          },
        });
      }

      return tx.post.findUnique({
        where: { id },
        include: {
          categories: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    res.status(200).json({
      status: "success",
      post,
    });
  } catch (err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  /* #swagger.tags = ['Post']*/
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return next(AppError.notFound("Post not found."));
    }

    if (post.authorId !== req.user.id) {
      return next(AppError.forbidden());
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(204).json({
      status: "success",
      post: null,
    });
  } catch (err) {
    next(err);
  }
};
