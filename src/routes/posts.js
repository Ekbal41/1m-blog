const express = require("express");
const postC = require("../controllers/postController");
const v = require("../middleware/validate");
const postVal = require("../validations/postValidation");
const protected = require("../middleware/auth");
const { cached } = require("../config/cache");

const router = express.Router();

router.get("/", cached, postC.getAllPosts);
router.get("/:id", postC.getPost);
router.get("/:slug", postC.getPostBySlug);
router.delete("/:id", protected, postC.deletePost);
router.post("/", protected, v(postVal.createPost), postC.createPost);
router.patch("/:id", protected, v(postVal.updatePost), postC.updatePost);

module.exports = router;
