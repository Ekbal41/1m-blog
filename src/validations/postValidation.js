// src/validations/postValidation.js
const Joi = require('joi');

exports.createPost = Joi.object({
  title: Joi.string().required().max(200),
  content: Joi.string().required(),
  categoryIds: Joi.array().items(Joi.string()).optional(),
  published: Joi.boolean().optional()
});

exports.updatePost = Joi.object({
  title: Joi.string().max(200).optional(),
  content: Joi.string().optional(),
  categoryIds: Joi.array().items(Joi.string()).optional(),
  published: Joi.boolean().optional()
});