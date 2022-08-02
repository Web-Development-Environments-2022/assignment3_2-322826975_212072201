var express = require("express");
var router = express.Router();
//const recipes_utils = require("./utils/recipes_utils"); 
router.get("/", (req, res) => res.send("im here"));
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const recipeuser_utils = require("./utils/recipeuser_utils");
const recipes_utils = require("../routes/utils/recipes_utils");


router.use(async function (req, res, next) {
    if (req.session && req.session.user_id) {
      DButils.execQuery("SELECT username FROM users").then((users) => {
        if (users.find((x) => x.username === req.session.user_id)) {
          req.user_id = req.session.user_id;
          next();
        }
      }).catch(err => next(err));
    } else {
      res.sendStatus(401);
    }
});
  


router.get("/get_3_last", async (req, res, next) => {
try {
    const user_id = req.session.user_id;
    const users = await DButils.execQuery("SELECT username FROM users");
    if (!users.find((x) => x.username === user_id))
        throw { status: 403, message: "user not logged in" };

    const recipes = await DButils.execQuery("SELECT id_recipe FROM watched where username='" + user_id + "' ORDER BY datime DESC LIMIT 3;");
    if (recipes.length == 0){
        res.status(203).send({recipes, message:"server could not find requested resources / not enough recipes in db"});
    }
    else{

    const recipes_objects = await recipeuser_utils.pushWatchedPrefered(recipes,user_id);
    res.status(200).send({recipes_objects, message:"OK"});
    }
} catch (error) {
    next(error);
}
});

router.get("/favorites", async (req, res, next) => {
    try {
        const user_id = req.session.user_id;
        const users = await DButils.execQuery("SELECT username FROM users");
        if (!users.find((x) => x.username === user_id))
            throw { status: 403, message: "user not logged in" };

        const recipes = await DButils.execQuery("SELECT id_recipe FROM prefered where username='" + user_id+"'");
        console.log(recipes);
        if (recipes.length == 0){
            res.status(204).send({recipes, message:"server could not find requested resources / not enough recipes in db"});
        }
        else{
        const recipes_objects = await recipeuser_utils.pushWatchedPrefered(recipes,user_id);
        res.status(200).send({recipes_objects, message:"OK"});
        }

        } catch (error) {
        next(error);
    }
});
    
router.put("/mark-as-prefered/:recipeID", async (req, res, next) => {
    try {
        const user_id = req.session.user_id;
        const users = await DButils.execQuery("SELECT username FROM users");
        if (!users.find((x) => x.username === user_id))
          throw { status: 403, message: "no logged-in user" };
        
        
        const recipe = await recipes_utils.getRecipeDetails(req.params.recipeID);
        if (!recipe){
            throw {status: 404, message: "could not find recipe id"}
        }
        const recipes = await recipeuser_utils.isInDB(user_id,req.params.recipeID,"prefered");
        if (recipes.length != 0){ //already marked as prefered
            
            res.status(200).send({ message: "already marked as prefered", success: true });
        }
        else{

        recipeuser_utils.markasprefered(user_id,req.params.recipeID);
        res.status(201).send({ message: "OK", success: true });
        }
    } catch (error) {
        next(error);
    }
});
router.put("/mark-as-watched/:recipeID", async (req, res, next) => {
    try {
        const user_id = req.session.user_id;
        const users = await DButils.execQuery("SELECT username FROM users");
        if (!users.find((x) => x.username === user_id))
          throw { status: 403, message: "no logged-in user" };
        
        const recipe = await recipes_utils.getRecipeDetails(req.params.recipeID);
        if (!recipe){
            throw {status: 404, message: "could not find recipe id"}
        }
    
        const recipes = await recipeuser_utils.isInDB(user_id,req.params.recipeID,"watched");

        if (recipes.length != 0){
            await recipeuser_utils.updateWatched(user_id,req.params.recipeID);
            res.status(200).send({ message: "OK", success: true });
        }
        else{
            await recipeuser_utils.addWatched(user_id,req.params.recipeID);
            res.status(200).send({ message: "OK", success: true });
        }
    } catch (error) {
        next(error);
    }
});     


router.post("/create_recipe", async (req, res, next) => {
    try {
        const user_id = req.session.user_id;
        const users = await DButils.execQuery("SELECT username FROM users");
        if (!users.find((x) => x.username === user_id))
            throw { status: 403, message: "no logged in user" };


        if (req.body.title && req.body.instructions && req.body.image && req.body.time_to_cook && req.body.popularity  && req.body.ingredients_list && req.body.pieces_amount)
        {
            await recipeuser_utils.addRecipePrivate(user_id,req.body.title , req.body.instructions , req.body.image , req.body.time_to_cook , req.body.popularity , req.body.vegetarian , req.body.vegan , req.body.gluten_free_sign , req.body.ingredients_list, req.body.pieces_amount)
            res.status(201).send({ message: "creation succeeded", success: true });
        }
        else
        {
            throw { status: 400, message: "one or more values are not according its pattern / missing" };
        }
    } catch (error) {
      next(error);
    }
});

router.get("/get_my_created", async (req, res, next) => {
    try {
        const user_id = req.session.user_id;
        const users = await DButils.execQuery("SELECT username FROM users");
        if (!users.find((x) => x.username === user_id))
            throw { status: 403, message: "user not logged in" };
    
        const recipes_objects = await DButils.execQuery("SELECT id_recipe as id,title,img as image,time_to_cook,popularity,vegetarian,vegan,gluten_free_sign FROM recipes where username='" + user_id+"'");
        if (recipes_objects.length == 0)
            res.status(204).send({recipes_objects,message:"server could not find requested resources / not enough recipes in db"});
        res.status(200).send({recipes_objects,message:"OK"});
    
    } catch (error) {
        next(error);
    }
});

router.get("/get_created_recipe/:recipeID", async (req, res, next) => {
    try {
        const user_id = req.session.user_id;
        const users = await DButils.execQuery("SELECT username FROM users");
        if (!users.find((x) => x.username === user_id))
            throw { status: 403, message: "user not logged in" };

        const recipes_objects = await DButils.execQuery("SELECT id_recipe as id,title,img as image,instructions,time_to_cook,popularity,vegetarian,vegan,gluten_free_sign,ingredients_list,pieces_amount FROM recipes where username='" + user_id+"' and id_recipe='"+req.params.recipeID+"'");
        if (recipes_objects.length == 0)
            throw { status: 404, message: "server could not find requested resources / not enough recipes in db" };
        res.status(200).send({recipes_objects,message:"OK"});
    
    } catch (error) {
        next(error);
    }
});

router.post("/create_family_recipe", async (req, res, next) => {
    try {
        const user_id = req.session.user_id;
        const users = await DButils.execQuery("SELECT username FROM users");
        if (!users.find((x) => x.username === user_id))
            throw { status: 403, message: "no logged in user" };

        if (req.body.title && req.body.instructions && req.body.image && req.body.time_to_cook && req.body.popularity && req.body.ingredients_list && req.body.pieces_amount && req.body.maker && req.body.when_making)
        {
            await recipeuser_utils.addRecipeFamily(user_id,req.body.title , req.body.instructions , req.body.image , req.body.time_to_cook , req.body.popularity , req.body.vegetarian , req.body.vegan , req.body.gluten_free_sign , req.body.ingredients_list, req.body.pieces_amount, req.body.maker, req.body.when_making)
            res.status(201).send({ message: "creation succeeded", success: true });
        }
        else
        {
            throw { status: 400, message: "one or more values are not according its pattern / missing" };
        }
    } catch (error) {
      next(error);
    }
  });
  
router.get("/get_family", async (req, res, next) => {
    try {
        const user_id = req.session.user_id;
        const users = await DButils.execQuery("SELECT username FROM users");
        if (!users.find((x) => x.username === user_id))
            throw { status: 403, message: "user not logged in" };
    
        const recipes_objects = await DButils.execQuery("SELECT id_recipe as id,title,img as image,time_to_cook,popularity,vegetarian,vegan,gluten_free_sign,maker,when_making,family_img FROM family_recipes where username='" + user_id+"'");
        if (recipes_objects.length == 0)
            res.status(204).send({recipes_objects,message:"server could not find requested resources / not enough recipes in db"});
        res.status(200).send({recipes_objects,message:"OK"});
    
    } catch (error) {
        next(error);
    }
});

router.get("/get_family_recipe/:recipeID", async (req, res, next) => {
    try {
        const user_id = req.session.user_id;
        const users = await DButils.execQuery("SELECT username FROM users");
        if (!users.find((x) => x.username === user_id))
            throw { status: 403, message: "user not logged in" };

        var recipes_objects = await DButils.execQuery("SELECT id_recipe as id,title,img as image,instructions,time_to_cook,popularity,vegetarian,vegan,gluten_free_sign,ingredients_list,pieces_amount,maker,when_making,family_img FROM family_recipes where username='" + user_id+"' and id_recipe='"+req.params.recipeID+"'");
        if (recipes_objects.length == 0)
        {
            throw { status: 404, message: "server could not find requested resources / not enough recipes in db" };
        }
        
        // var recipe=recipes[0];
        res.status(200).send({recipes_objects,message:"OK"});
    
    } catch (error) {
        next(error);
    }
});


module.exports = router;