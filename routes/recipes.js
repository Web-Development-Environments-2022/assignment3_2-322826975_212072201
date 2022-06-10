var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const DButils = require("../routes/utils/DButils");

router.get("/", (req, res) => res.send("im here"));


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/get_3_random", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipes = await recipes_utils.get3randoms();
    const recipes_objects = await recipes_utils.pushWatchedPrefered(recipes,user_id);
    res.status(200).send({recipes_objects, message:"OK"});
  } catch (error) {
    next(error);
  }
});


router.get("/get_recipe/:recipeID", async (req, res, next) => {
  try {
    
    const user_id = req.session.user_id;
    let recipe = await recipes_utils.getRecipeDetails(req.params.recipeID);
    if (recipe){
      const recipes_objects = await recipes_utils.pushWatchedPrefered([recipe],user_id);
      res.status(200).send({recipes_objects, message:"OK"});
    }
    else
      res.status(204).send({recipe, message:"could not find recipe id"});
  } catch (error) {
    next(error);
  }
});

router.get("/full_recipe/:recipeID", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    let recipe = await recipes_utils.getFullRecipeDetails(req.params.recipeID);
    if (recipe){
      const recipes_objects = await recipes_utils.pushWatchedPrefered([recipe],user_id);
      res.status(200).send({recipes_objects, message:"OK"});
    }
    
    else
    res.status(204).send({recipe, message:"could not find recipe id"});
  }
   catch (error) {
    next(error);
  }
});

module.exports = router;
