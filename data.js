const mongoose = require('mongoose');
const casual = require('casual');

const User = require('./src/models/Users');
const Event = require('./src/models/Events');
const Donation = require('./src/models/Donations');
const BlogPost = require('./src/models/BlogPosts');
const Category = require('./src/models/Categories');
const Tag = require('./src/models/Tags');

(async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://doadmin:8YVn476BbE321mp9@db-mongodb-fra1-65852-846c044b.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=db-mongodb-fra1-65852',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    // Generate Sample Data
  
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
})();

async function generateSampleEvents(count) {
  try {
    for (let i = 0; i < count; i++) {
      const event = new Event({
        creator: new mongoose.Types.ObjectId(), // Fixed: Use new keyword
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
        tags: [], // You might need to populate these with actual tag IDs
        capacity: casual.integer(10, 100),
        participants: [], // You might need to populate these with actual user IDs
        donations: [], // You might need to populate these with actual donation IDs
      });

      await event.save();

      console.log(`Event ${i + 1} saved.`);
    }
    console.log(`${count} sample events generated.`);
  } catch (error) {
    console.error('Error:', error);
  }
}
async function generateSampleCategories(count) {
  try {
    for (let i = 0; i < count; i++) {
      const category = new Category({
        categoryName: casual.word,
      });

      await category.save();
      console.log(`Category ${i + 1} saved.`);
    }
    console.log(`${count} sample categories generated.`);
  } catch (error) {
    console.error('Error:', error);
  }
}
async function generateSampleUsers(count) {
  try {
    for (let i = 0; i < count; i++) {
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

      await user.save();

      console.log(`User ${i + 1} saved.`);
    }
    console.log(`${count} sample users generated.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function generateSampleTags(count) {
  try {
    for (let i = 0; i < count; i++) {
      const tag = new Tag({
        tagName: casual.word,
});
    await tag.save();
  
        console.log(`Tag ${i + 1} saved.`);
      }
      console.log(`${count} sample tags generated.`);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  async function generateSampleDonations(count) {
    try {
      for (let i = 0; i < count; i++) {
        const donation = new Donation({
          donor: new mongoose.Types.ObjectId(), // Use new keyword
          event: new mongoose.Types.ObjectId(), // Use new keyword
          amount: casual.integer(10, 500),
          donationDate: casual.date('YYYY-MM-DD'),
        });
  
        await donation.save();
  
        console.log(`Donation ${i + 1} saved.`);
      }
      console.log(`${count} sample donations generated.`);
    } catch (error) {
      console.error('Error:', error);
    }
  }
async function generateSampleBlogPosts(count) {
  try {
    for (let i = 0; i < count; i++) {
      const blogPost = new BlogPost({
        author: new mongoose.Types.ObjectId(), // Use new keyword
        title: casual.title,
        bannerImage: casual.url,
        category: new mongoose.Types.ObjectId(), // Use new keyword
        shortDescription: casual.sentences(2),
        bodyText: casual.text, // Use casual.text to generate body text
        postDate: casual.date('YYYY-MM-DD'),
      });

        await blogPost.save();
      console.log(`Blog post ${i + 1} saved.`);
    }
    console.log(`${count} sample blog posts generated.`);
  } catch (error) {
    console.error('Error:', error);
}
} 

await generateSampleUsers(5);
await generateSampleEvents(10);
await generateSampleDonations(15);
await generateSampleBlogPosts(8);
await generateSampleCategories(5);
await generateSampleTags(7);
