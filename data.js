const mongoose = require('mongoose');
const casual = require('casual');

const User = require('./src/models/Users');
const Event = require('./src/models/Events');
const Donation = require('./src/models/Donations');
const BlogPost = require('./src/models/BlogPosts');
const Category = require('./src/models/Categories');
const Tag = require('./src/models/Tags');

async function generateSampleEvents(count) {
  try {
    for (let i = 0; i < count; i += 1) {
      const event = new Event({
        creator: new mongoose.Types.ObjectId(),
        title: casual.title,
        description: casual.description,
        bannerImage: casual.url,
        location: casual.address,
        startDate: casual.date('YYYY-MM-DD'),
        endDate: casual.date('YYYY-MM-DD'),
        ageLimit: {
          lower: casual.integer(0, 17),
          upper: casual.integer(18, 99),
        },
        tags: [],
        capacity: casual.integer(10, 100),
        participants: [],
        donations: [],
      });

      event.save();

      // console.log(`Event ${i + 1} saved.`);
    }
    // console.log(`${count} sample events generated.`);
  } catch (error) {
    // console.error('Error:', error);
  }
}
async function generateSampleCategories(count) {
  try {
    for (let i = 0; i < count; i += 1) {
      const category = new Category({
        categoryName: casual.word,
      });

      category.save();
      // console.log(`Category ${i + 1} saved.`);
    }
    // console.log(`${count} sample categories generated.`);
  } catch (error) {
    // console.error('Error:', error);
  }
}
async function generateSampleUsers(count) {
  try {
    for (let i = 0; i < count; i += 1) {
      const user = new User({
        googleId: casual.uuid,
        name: casual.full_name,
        email: casual.email,
        password: casual.password,
        isVerified: casual.boolean,
        dob: casual.date('YYYY-MM-DD'),
        phone: casual.phone,
        location: {
          provinceState: casual.state,
          country: casual.country,
        },
        profilePicture: casual.url,
        userType: casual.random_element(['admin', 'regular']),
        accountCreatedOn: casual.date(),
      });

      user.save();

      // console.log(`User ${i + 1} saved.`);
    }
    // console.log(`${count} sample users generated.`);
  } catch (error) {
    // console.error('Error:', error);
  }
}

async function generateSampleTags(count) {
  try {
    for (let i = 0; i < count; i += 1) {
      const tag = new Tag({
        tagName: casual.word,
      });
      tag.save();

      // console.log(`Tag ${i + 1} saved.`);
    }
    // console.log(`${count} sample tags generated.`);
  } catch (error) {
    // console.error('Error:', error);
  }
}
async function generateSampleDonations(count) {
  try {
    for (let i = 0; i < count; i += 1) {
      const donation = new Donation({
        donor: new mongoose.Types.ObjectId(),
        event: new mongoose.Types.ObjectId(),
        amount: casual.integer(10, 500),
        donationDate: casual.date('YYYY-MM-DD'),
      });

      donation.save();

      // console.log(`Donation ${i + 1} saved.`);
    }
    // console.log(`${count} sample donations generated.`);
  } catch (error) {
    // console.error('Error:', error);
  }
}
async function generateSampleBlogPosts(count) {
  try {
    for (let i = 0; i < count; i += 1) {
      const blogPost = new BlogPost({
        author: new mongoose.Types.ObjectId(),
        title: casual.title,
        bannerImage: casual.url,
        category: new mongoose.Types.ObjectId(),
        shortDescription: casual.sentences(2),
        bodyText: casual.text,
        postDate: casual.date('YYYY-MM-DD'),
      });

      blogPost.save();
      // console.log(`Blog post ${i + 1} saved.`);
    }
    // console.log(`${count} sample blog posts generated.`);
  } catch (error) {
    // console.error('Error:', error);
  }
}
(async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://doadmin:8YVn476BbE321mp9@db-mongodb-fra1-65852-846c044b.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=db-mongodb-fra1-65852',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    await generateSampleUsers(5);
    await generateSampleEvents(5);
    await generateSampleDonations(5);
    await generateSampleBlogPosts(5);
    await generateSampleCategories(10);
    await generateSampleTags(10);

    mongoose.disconnect();
  } catch (error) {
    // console.error('Error:', error);
  }
})();
