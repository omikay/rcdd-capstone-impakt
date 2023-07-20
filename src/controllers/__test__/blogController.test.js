const User = require('../../models/Users');
const BlogPost = require('../../models/BlogPosts');
const Category = require('../../models/Categories');
const {
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogById,
  getAllBlogs,
} = require('../blogController');

jest.mock('../../models/BlogPosts');
jest.mock('../../models/Users');
jest.mock('../../models/Categories');
jest.mock('express', () => ({
  request: {
    res: {
      status: jest.fn(),
    },
  },
}));
describe('createBlog', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

 it('should create a blog post and return it', async () => {
  const req = {
    user: {
      userType: 'admin',
      id: 'userId',
    },
    body: {
      title: 'Test Blog Post',
      bannerImage: 'test_banner.png',
      category: 'category123',
      shortDescription: 'Test Short Description',
      bodyText: 'Test Body Text',
    },
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const userMock = {
    _id: 'userId',
    userType: 'admin',
  };

  const categoryMock = {
    _id: 'category123',
  };

  const savedBlogPostMock = {
    _id: 'blogPostId',
    title: req.body.title,
    bannerImage: req.body.bannerImage,
    category: req.body.category,
    shortDescription: req.body.shortDescription,
    bodyText: req.body.bodyText,
  };

  jest.spyOn(User, 'findById').mockResolvedValueOnce(userMock);
  jest.spyOn(Category, 'findById').mockResolvedValueOnce(categoryMock);
  jest.spyOn(BlogPost.prototype, 'save').mockResolvedValueOnce(savedBlogPostMock);

  await createBlog(req, res);

  expect(res.status).toBeCalledWith(201);
  expect(res.json).toBeCalledWith(savedBlogPostMock);
  expect(User.findById).toBeCalledWith('userId');
  expect(Category.findById).toBeCalledWith('category123');
  expect(BlogPost.prototype.save).toBeCalled();
});

  it('should return 404 if the user is not found', async () => {
    const req = {
      user: {
        userType: 'admin',
        id: 'userId',
      },
      body: {
        title: 'Test Blog Post',
        bannerImage: 'test_banner.png',
        category: 'category123',
        shortDescription: 'Test Short Description',
        bodyText: 'Test Body Text',
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    jest.spyOn(User, 'findById').mockResolvedValueOnce(null);
  
    await createBlog(req, res);
  
    expect(res.status).toBeCalledWith(404);
    expect(res.json).toBeCalledWith({ error: 'User not found' });
    expect(User.findById).toBeCalledWith('userId');
    expect(Category.findById).not.toBeCalled();
    expect(BlogPost.prototype.save).not.toBeCalled();
  });
  
  it('should return 401 if the user is not an admin', async () => {
    const req = {
      user: {
        userType: 'regular',
        id: 'userid',
      },
      body: {
        title: 'Test Blog Post',
        bannerImage: 'test_banner.png',
        category: 'category123',
        shortDescription: 'Test Short Description',
        bodyText: 'Test Body Text',
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    const userMock = {
      _id: 'userid',
      userType: 'regular',
    };
    jest.spyOn(User, 'findById').mockResolvedValueOnce(userMock);
  
    await createBlog(req, res);
    expect(res.status).toBeCalledWith(401);
    expect(res.json).toBeCalledWith({ error: 'Unauthorized' });
    expect(User.findById).toBeCalledWith('userid');
    expect(Category.findById).not.toBeCalled();
    expect(BlogPost.prototype.save).not.toBeCalled();
  });
  

  it('should return 404 if the category is not found', async () => {
    const req = {
      user: {
        userType: 'admin',
        id: 'userId',
      },
      body: {
        title: 'Test Blog Post',
        bannerImage: 'test_banner.png',
        category: 'category123',
        shortDescription: 'Test Short Description',
        bodyText: 'Test Body Text',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const userMock = {
      _id: 'userId',
      userType: 'admin',
    };
    
    jest.spyOn(User, 'findById').mockResolvedValueOnce(userMock);
    jest.spyOn(Category, 'findById').mockResolvedValueOnce(null);

    await createBlog(req, res);

    expect(res.status).toBeCalledWith(404);
    expect(res.json).toBeCalledWith({ error: 'Category not found' });
    expect(User.findById).toBeCalledWith('userId');
    expect(Category.findById).toBeCalledWith('category123');
    expect(BlogPost.prototype.save).not.toBeCalled();
  });

  it('should handle internal server errors', async () => {
    const req = {
      user: {
        userType: 'admin',
        id: 'userId',
      },
      body: {
        title: 'Test Blog Post',
        bannerImage: 'test_banner.png',
        category: 'category123',
        shortDescription: 'Test Short Description',
        bodyText: 'Test Body Text',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const userMock = {
      _id: 'userId',
      userType: 'admin',
    };
    
    const categoryMock = {
      _id: 'category123',
    };

    jest.spyOn(User, 'findById').mockResolvedValueOnce(userMock);
    jest.spyOn(Category, 'findById').mockResolvedValueOnce(categoryMock);
    jest
      .spyOn(BlogPost.prototype, 'save')
      .mockRejectedValueOnce(new Error('Some error occurred'));

    await createBlog(req, res);

    expect(res.status).toBeCalledWith(500);
    expect(res.json).toBeCalledWith({ error: 'Server error' });
    expect(User.findById).toBeCalledWith('userId');
    expect(Category.findById).toBeCalledWith('category123');
    expect(BlogPost.prototype.save).toBeCalled();
  });
});
describe('updateBlog', () => {
  it('should update a blog post and return the updated post', async () => {
    const updatedBlogData = {
      title: 'Updated Title',
      bannerImage: 'updated_banner.png',
      category: 'Updated Category',
      shortDescription: 'Updated short description',
      bodyText: 'Updated body text',
    };

    const existingBlogPost = {
      _id: 'existingBlogPostId',
    };
  
    const req = {
      params: {
        id: existingBlogPost.id,
      },
      body: updatedBlogData,
      user: {
        userType: 'admin',
        id: 'userId',
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    jest.spyOn(BlogPost, 'findById').mockResolvedValueOnce(existingBlogPost);
    jest.spyOn(User, 'findById').mockResolvedValueOnce({ userType: 'admin' });
    jest.spyOn(BlogPost, 'findByIdAndUpdate').mockResolvedValueOnce(updatedBlogData);
  
    await updateBlog(req, res);
  
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(updatedBlogData);
  })
  
  it('should return 404 if the blog post does not exist', async () => {
    const updatedBlogData = {
      title: 'Updated Title',
      bannerImage: 'updated_banner.png',
      category: 'Updated Category',
      shortDescription: 'Updated short description',
      bodyText: 'Updated body text',
    };
    const nonExistingId = 'nonExistingId';
    const req = {
      params: {
        id: nonExistingId,
      },
      body: updatedBlogData,
      user: {
        userId: 'adminUserId', // User ID of an admin user
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await updateBlog(req, res);
    expect(res.status).toBeCalledWith(404);
    expect(res.json).toBeCalledWith({ error: 'Blog post not found' });
  });
  it('should return 404 if the user is not found', async () => {
    const existingBlogPost = {
      _id: 'existingBlogPostId',
    };
  
    const req = {
      params: {
        id: existingBlogPost.id,
      },
      body: {
        title: 'Updated Title',
        bannerImage: 'updated_banner.png',
        category: 'Updated Category',
        shortDescription: 'Updated short description',
        bodyText: 'Updated body text',
      },
      user: {
        userType: 'admin',
        id: 'userId',
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    jest.spyOn(BlogPost, 'findById').mockResolvedValueOnce(existingBlogPost);
    jest.spyOn(User, 'findById').mockResolvedValueOnce(null);
  
    await updateBlog(req, res);
  
    expect(res.status).toBeCalledWith(404);
    expect(res.json).toBeCalledWith({ error: 'User not found' }); 
})
it('should return 401 if the user is not an admin', async () => {
  const existingBlogPost = {
    _id: 'existingBlogPostId',
  };

  const req = {
    params: {
      id: existingBlogPost.id,
    },
    body: {
      title: 'Updated Title',
      bannerImage: 'updated_banner.png',
      category: 'Updated Category',
      shortDescription: 'Updated short description',
      bodyText: 'Updated body text',
    },
    user: {
      userType: 'regular',
      id: 'userId',
    },
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  jest.spyOn(BlogPost, 'findById').mockResolvedValueOnce(existingBlogPost);
  jest.spyOn(User, 'findById').mockResolvedValueOnce({ userType: 'regular' });

  await updateBlog(req, res);

  expect(res.status).toBeCalledWith(401);
  expect(res.json).toBeCalledWith({ error: 'Unauthorized' });
});

it('should handle internal server errors', async () => {
  const existingBlogPost = {
    _id: 'existingBlogPostId',
  };

  const req = {
    params: {
      id: existingBlogPost.id,
    },
    body: {
      title: 'Updated Title',
      bannerImage: 'updated_banner.png',
      category: 'Updated Category',
      shortDescription: 'Updated short description',
      bodyText: 'Updated body text',
    },
    user: {
      userType: 'admin',
      id: 'userId',
    },
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  jest.spyOn(BlogPost, 'findById').mockResolvedValueOnce(existingBlogPost);
  jest.spyOn(User, 'findById').mockResolvedValueOnce({ userType: 'admin' });
  jest.spyOn(BlogPost, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('Some error occurred'));

  await updateBlog(req, res);

  expect(res.status).toBeCalledWith(500);
  expect(res.json).toBeCalledWith({ error: 'Internal server error' });
});

})
describe('deleteBlog', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should delete a blog post and return success message', async () => {
    const blogPostId = 'existingBlogPostId';
    const req = {
      user: {
        userType: 'admin',
        id: 'userId',
      },
      params: {
        blogPostId,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const blogPostMock = {
      _id: blogPostId,
    };
    jest.spyOn(User, 'findById').mockResolvedValueOnce({ userType: 'admin' });
    jest.spyOn(BlogPost, 'findById').mockResolvedValueOnce(blogPostMock);
    jest.spyOn(BlogPost, 'findByIdAndDelete').mockResolvedValueOnce();
    await deleteBlog(req, res);
    expect(res.status).toBeCalledWith(200); // Update the expected status to 200
    expect(res.json).toBeCalledWith({
      message: 'Blog post deleted successfully.',
    });
  });
  it('should return 404 if the user is not found', async () => {
    const blogPostId = 'existingBlogPostId';
  
    const req = {
      user: {
        userType: 'admin',
        id: 'userId',
      },
      params: {
        blogPostId,
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const blogPostMock = {
      _id: blogPostId,
    };
    jest.spyOn(BlogPost, 'findById').mockResolvedValueOnce(blogPostMock);
    jest.spyOn(User, 'findById').mockResolvedValueOnce(null);
  
    await deleteBlog(req, res);
  
    expect(res.status).toBeCalledWith(404);
    expect(res.json).toBeCalledWith({ error: 'User not found' });
  });
  
  it('should return 401 if the user is not an admin', async () => {
    const blogPostId = 'existingBlogPostId';
    const req = {
      user: {
        userType: 'regular',
        id: 'userId',
      },
      params: {
        blogPostId,
      },
    };
    const blogPostMock = {
      _id: blogPostId,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.spyOn(BlogPost, 'findById').mockResolvedValueOnce(blogPostMock);
    jest.spyOn(User, 'findById').mockResolvedValueOnce({ userType: 'regular' });

    await deleteBlog(req, res);
    expect(res.status).toBeCalledWith(401);
    expect(res.json).toBeCalledWith({ error: 'Unauthorized' });
  });

  it('should return 404 if the blog post does not exist', async () => {
    const nonExistingId = 'nonExistingId';
    const req = {
      params: {
        id: nonExistingId,
      },
      user: {
        userId: 'adminUserId', // User ID of an admin user
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await deleteBlog(req, res);

    expect(res.status).toBeCalledWith(404);
    expect(res.json).toBeCalledWith({ error: 'Blog post not found.' });
  });

  it('should handle internal server errors', async () => {
    const blogPostId = 'existingBlogPostId';

    const req = {
      user: {
        userType: 'admin',
        id: 'userId',
      },
      params: {
        blogPostId,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(BlogPost, 'findById').mockRejectedValueOnce(new Error('Some error occurred'));
    await deleteBlog(req, res);

    expect(res.status).toBeCalledWith(500);
    expect(res.json).toBeCalledWith({ error: 'Server error' });
  });
});
describe('getBlogById', () => {
  it('should return a blog post for a valid ID', async () => {
    const blogPostId = 'validBlogPostId';

    const req = {
      params: {
        id: blogPostId,
      },
      user: {
        id: 'userId',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const blogPostMock = {
      _id: blogPostId,
      title: 'Test Blog Post',
      bannerImage: 'test_banner.png',
      category: 'Test Category',
      shortDescription: 'Test Short Description',
      bodyText: 'Test Body Text',
    };
    const userMock = {
      _id: 'userId',
    };
    jest.spyOn(BlogPost, 'findById').mockResolvedValueOnce(blogPostMock);
    jest.spyOn(User, 'findById').mockResolvedValueOnce(userMock);

    await getBlogById(req, res);

    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(blogPostMock);
    expect(BlogPost.findById).toBeCalledWith(blogPostId);
    expect(User.findById).toBeCalledWith(req.user.id);
  });
  it('should return 404 for an invalid ID', async () => {
    const invalidId = 'invalidId';
    const req = {
      params: {
        id: invalidId,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(BlogPost, 'findById').mockResolvedValueOnce(null);

    await getBlogById(req, res);
    expect(res.status).toBeCalledWith(404);
    expect(res.json).toBeCalledWith({ error: 'Blog post not found' });
    expect(BlogPost.findById).toBeCalledWith(invalidId);
  });
  it('should return 404 if the user is not found', async () => {
    const blogPostId = 'validBlogPostId';
  
    const req = {
      params: {
        id: blogPostId,
      },
      user: {
        id: 'nonExistingUserId',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const blogPostMock = {
      _id: blogPostId,
      title: 'Test Blog Post',
      bannerImage: 'test_banner.png',
      category: 'Test Category',
      shortDescription: 'Test Short Description',
      bodyText: 'Test Body Text',
    };
    jest.spyOn(BlogPost, 'findById').mockResolvedValueOnce(blogPostMock);
    jest.spyOn(User, 'findById').mockResolvedValueOnce(null);
  
    await getBlogById(req, res);
  
    expect(res.status).toBeCalledWith(404);
    expect(res.json).toBeCalledWith({ error: 'User not found' });
    expect(BlogPost.findById).toBeCalledWith(blogPostId);
    expect(User.findById).toBeCalledWith(req.user.id);
  });
  
  it('should handle internal server errors', async () => {
    const blogPostId = 'validBlogPostId';
    const req = {
      params: {
        id: blogPostId,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.spyOn(BlogPost, 'findById').mockRejectedValueOnce(new Error('Some error occurred'));

    await getBlogById(req, res);

    expect(res.status).toBeCalledWith(500);
    expect(res.json).toBeCalledWith({ error: 'Server error' });
    expect(BlogPost.findById).toBeCalledWith(blogPostId);
  });
});


describe('getAllBlogs', () => {
  it('should return all blog posts', async () => {
    const blogPostsMock = [
      {
        _id: 'blogPostId1',
        title: 'Blog Post 1',
        bannerImage: 'banner1.png',
        category: 'Category 1',
        shortDescription: 'Short description 1',
        bodyText: 'Body text 1',
      },
      {
        _id: 'blogPostId2',
        title: 'Blog Post 2',
        bannerImage: 'banner2.png',
        category: 'Category 2',
        shortDescription: 'Short description 2',
        bodyText: 'Body text 2',
      },
    ];

    const req = {user: {
      id: 'userId',
    },};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const userMock = {
      _id: 'userId',
    };
    jest.spyOn(User, 'findById').mockResolvedValueOnce(userMock);
    jest.spyOn(BlogPost, 'find').mockResolvedValueOnce(blogPostsMock);
    await getAllBlogs(req, res);

    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(blogPostsMock);
    expect(BlogPost.find).toBeCalled();
  });

  it('should handle internal server errors', async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest
      .spyOn(BlogPost, 'find')
      .mockRejectedValueOnce(new Error('Some error occurred'));
    await getAllBlogs(req, res);
    expect(res.status).toBeCalledWith(500);
    expect(res.json).toBeCalledWith({ error: 'Server error' });
    expect(BlogPost.find).toBeCalled();
  });
});
