const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    //Check for user auth and return thier info
    me: async (context) => {
      if (context.user) {
      const userData =  User.findOne({ _id: context.user._id}).select('-__v -password').populate('savedbooks');
      return userData;
      }
      throw new AuthenticationError('You are not logged in');
    },
  },

  Mutation: {
    //Create a new user based on passed args and authenticate
    addUser: async (args) => {
        const newUser = await User.create(args);
        const token = signToken(newUser);
        return {token, newUser};
      },
    },

    // Login verification
    login: async ({email, password}) => {
      const loginUser = await User.findOne({email});

      if (!loginUser) {
        throw new AuthenticationError('No user with that email');
      }
      const loginPassword = await User.isCorrectPassword(password);
      if (!loginPassword){
        throw new AuthenticationError('Incorrect password');
      }

      const token = signToken(loginUser);
      return {token, loginUser};
    },

    //save a book to a users saved books profile
    saveBook: async({input}, {user}) => {
      if (user){
        const bookUser = await User.findByIdAndUpdate(
          {_id: user._id},
          {$addToSet: {savedBooks: input}},
          {new: true, runValidators: true}
        );
      
        return bookUser;
      }
      throw new AuthenticationError( ' Please login to save a book! ');
    },

    //remove a saved book from a users profile
    removeBook: async({bookId}, {user}) => {
      if (user){
        const bookUser = await User.findByIdAndUpdate(
          {_id: user._id},
          {$pull: {savedBooks: {bookId: bookId}}},
          {new: true, runValidators: true}
        );
      
        return bookUser;
      }
      throw new AuthenticationError( ' Please login to remove a saved book! ');
    },
};

module.exports = resolvers;