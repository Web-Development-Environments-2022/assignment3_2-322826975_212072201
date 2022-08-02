
const axios = require("axios");
const req = require("express/lib/request");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");
const recipes_utils = require("./recipes_utils");

  
  

async function pushWatchedPrefered(recipes,user_id){

    let recipes_objects =[];

    for(let i=0; i<recipes.length; i++)
    {
        let rec_object= await recipes_utils.getRecipeDetails(recipes[i]["id_recipe"]);

        let Prefered = await DButils.execQuery("SELECT * FROM prefered where username='" + user_id+"' and id_recipe='"+recipes[i]["id_recipe"]+"'");
        let Watched = await DButils.execQuery("SELECT * FROM watched where username='" + user_id+"' and id_recipe='"+recipes[i]["id_recipe"]+"'");
        rec_object["isPrefered"] = false;
        rec_object["isWatched"] =false;
        if (Prefered.length != 0)
          rec_object["isPrefered"]=true;
        if (Watched.length != 0)
            rec_object["isWatched"] =true;
        recipes_objects.push(rec_object);
    }
    
    return recipes_objects;

}

async function markasprefered(user_id,recipeID)
{
    await DButils.execQuery(
        `INSERT INTO prefered VALUES ('${user_id}', '${recipeID}')`
        );
}

async function isInDB(user_id,recipeID,table_name)
{
    return await DButils.execQuery("SELECT * FROM "+table_name+" where username='" + user_id+"' and id_recipe='"+recipeID+"'");
}

async function dateCalculation(){
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    let d= ""+ year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;    
    return d;
}
async function updateWatched(user_id,recipeID){
    d = await dateCalculation();
    await DButils.execQuery("Update watched set datime='"+d+"' where username='" + user_id+"' and id_recipe='"+recipeID+"'");

}

async function addWatched(user_id,recipeID)
{
    d= await dateCalculation();
    await DButils.execQuery(
        `INSERT INTO watched VALUES ('${user_id}', '${recipeID}','${d}')`
        );
}

async function addRecipePrivate(user_id ,title, instructions, image, time_to_cook, popularity, vegetarian, vegan, gluten_free_sign, ingredients_list, pieces_amount)
{
    let id = -1;
    let top_id = await DButils.execQuery("SELECT id_recipe FROM recipes ORDER BY id_recipe DESC LIMIT 1");
    
    if(top_id.length==0){
        id=0;
    }
    else{
        id = parseInt(top_id[0].id_recipe)+1;
    }

    await DButils.execQuery(
        `INSERT INTO recipes VALUES ('${user_id}', '${id}','${title}','${instructions}'
        ,'${time_to_cook}','${popularity}','${vegetarian}','${vegan}','${gluten_free_sign}'
        ,'${ingredients_list}','${pieces_amount}','${image}');`
    );
    
}

async function addRecipeFamily(user_id ,title, instructions, image, time_to_cook, popularity, vegetarian, vegan, gluten_free_sign, ingredients_list, pieces_amount,maker,when_making)
{
    let id = -1;
    let top_id = await DButils.execQuery("SELECT id_recipe FROM family_recipes ORDER BY id_recipe DESC LIMIT 1");
    
    if(top_id.length==0){
        id=0;
    }
    else{
        id = parseInt(top_id[0].id_recipe)+1;
    }

    await DButils.execQuery(
        `INSERT INTO family_recipes VALUES ('${user_id}', '${id}','${title}','${instructions}'
        ,'${image}','${time_to_cook}','${popularity}','${vegetarian}','${vegan}','${gluten_free_sign}'
        ,'${ingredients_list}','${pieces_amount}','${maker}','${when_making}');`
    );
    
}


exports.pushWatchedPrefered = pushWatchedPrefered;
exports.markasprefered=markasprefered;
exports.isInDB=isInDB;
exports.updateWatched=updateWatched;
exports.addWatched=addWatched;
exports.addRecipePrivate=addRecipePrivate;
exports.addRecipeFamily=addRecipeFamily;


