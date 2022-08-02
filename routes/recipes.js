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


router.get("/search_recipe", async (req, res, next) => {
  try {
      const user_id=req.session.user_id;
      const users = await DButils.execQuery("SELECT username FROM users");
      let is_connected=true;
      if (!users.find((x) => x.username === user_id))
          is_connected=false;

      if (!req.query.search_string)
          throw { status: 400, message: "params given not correct" };
      let num=5;
      if (req.query.number)
      {
          if(req.query.number==5 || req.query.number==10 || req.query.number==15)
              num=req.query.number;
      }
      const recipes = await recipes_utils.search_recipes(req.query.search_string,
          num,
          req.query.cuisine,
          req.query.diet,
          req.query.intolerances);
      let recipes_objects =[];
      console.log(recipes);
      if (!recipes || recipes.length==0)
      {
          res.status(204).send(message="server could not find requested resources");
      }
      else{
      recipes_objects = await recipes_utils.searchWatchedPrefered(recipes,user_id);
      if (is_connected){
        req.session.lastSearchResults = recipes_objects;
        req.session.lastSearchTitle= {
            search_string:req.query.search_string,
            number:req.query.number,
            cuisine:req.query.cuisine,
            diet:req.query.diet,
            intolerances:req.query.intolerances
        };  
      }
      else{
        req.session.lastSearchResults="";
        req.session.lastSearchTitle="";
      }
      res.status(200).send({recipes_objects,message:"OK"});
      }
  } catch (error) {
      next(error);
  }
});  


module.exports = router;
