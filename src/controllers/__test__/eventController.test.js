const { searchEvents } = require('../eventController');
const Event = require('../../models/Events');
const Tag = require('../../models/Tags');

jest.mock('../../models/Events'); // Mock the Event model
jest.mock('../../models/Tags'); // Mock the Tag model

beforeEach(() => {
  jest.clearAllMocks(); // Clear mock calls before each test
});

describe('searchEvents', () => {
  it('should search events with the given parameters', async () => {
    // Mock data for request query
    const req = {
      query: {
        search: 'example search',
        location: 'example location',
        startDate: '2023-07-19',
        endDate: '2023-07-21',
        tags: ['tag1', 'tag2'],
      },
    };

    // Mock data for the expected response from the Event model
    const mockEventResults = [
      { title: 'Event 1', description: 'Description 1', tags: ['tag1'] },
      { title: 'Event 2', description: 'Description 2', tags: ['tag2'] },
    ];

    // Mock the Event.find method to return the mockEventResults
    Event.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockEventResults),
    });

    // Mock the Tag.find method to return empty results (since tags are populated separately)
    Tag.find.mockResolvedValue([]);

    // Mock the Tag.populate method to return the mock tags
    const mockPopulatedTags = [
      { _id: 'tag1', tag_name: 'Tag 1' },
      { _id: 'tag2', tag_name: 'Tag 2' },
    ];
    Tag.populate.mockResolvedValue(mockPopulatedTags);

    // Mock the response object's methods
    const res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    // Call the function with the mock request and response objects
    await searchEvents(req, res);

    // Assertion: Check if Event.find was called with the correct filter
    expect(Event.find).toHaveBeenCalledWith({
      $or: [
        { title: { $regex: 'example search', $options: 'i' } },
        { description: { $regex: 'example search', $options: 'i' } },
      ],
      location: { $regex: 'example location', $options: 'i' },
      startDate: { $gte: new Date('2023-07-19') },
      endDate: { $lte: new Date('2023-07-21') },
      tags: { $in: ['tag1', 'tag2'] },
    });

    // Assertion: Check if the populate method was called with the correct arguments
    expect(Event.find().populate).toHaveBeenCalledWith('tags', 'tag_name');

    // Assertion: Check if the response.json method was called with the expected data
    expect(res.json).toHaveBeenCalledWith(mockEventResults);
  });

  it('should handle errors during search', async () => {
    // Mock request query with some invalid data
    const req = {
      query: {
        startDate: '2023-07-19', // Provide a valid date string here
      },
    };

    // Mock the Event.find method to throw an error
    Event.find.mockImplementation(() => {
      throw new Error('Database error');
    });

    // Mock the response object's methods
    const res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    // Call the function with the mock request and response objects
    await searchEvents(req, res);

    // Assertion: Check if Event.find was called with the correct filter
    expect(Event.find).toHaveBeenCalledWith({
      startDate: { $gte: new Date('2023-07-19') }, // Provide the valid date here
    });

    // Assertion: Check if the response status was set to 500
    expect(res.status).toHaveBeenCalledWith(500);

    // Assertion: Check if the response.json method was called with the error message
    expect(res.json).toHaveBeenCalledWith({
      error: 'An error occurred while searching the events.',
    });
  });
});
