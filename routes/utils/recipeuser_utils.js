
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
        ,'${image}','${time_to_cook}','${popularity}','${vegetarian}','${vegan}','${gluten_free_sign}'
        ,'${ingredients_list}','${pieces_amount}');`
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

async function search_recipes(str_to_search,num,cusine,diet,intolerances) {
    try{
        let str=""
        if (cusine)
        {
            str+="&cuisine="
            str+=cusine
        }
        if (diet)
        {
            str+="&diet="
            str+=diet
        }
        if (intolerances)
        {
            str+="&intolerances="
            str+=intolerances
        }
        let recipes = await axios.get(`${api_domain}/complexSearch?query=${str_to_search}&number=${num}${str}`, {
            params: {
                includeNutrition: false,
                apiKey: process.env.spooncular_apiKey
            }
        });
        let recipes_obj=[];
        
        for (let j=0; j<recipes.data.results.length;j++)
        {
            let recipe_info = await recipes_utils.getRecipeInformation(recipes.data.results[j]["id"]);
            let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, instructions } = recipe_info.data;
            
            recipes_obj.push(
             {
                id: id,
                title: title,
                time_to_cook: readyInMinutes,
                image: image,
                popularity: aggregateLikes,
                vegan: vegan,
                vegetarian: vegetarian,
                gluten_free_sign: glutenFree,
                instructions: instructions
            }  
            );      
        }
        return recipes_obj;
    }
    catch(error){
        console.log(error);
        return;
    }
}

async function searchWatchedPrefered(recipes,user_id){

    let recipes_objects =[];

    for(let i=0; i<recipes.length; i++)
    {
        let Prefered = await DButils.execQuery("SELECT * FROM prefered where username='" + user_id+"' and id_recipe='"+recipes[i]["id"]+"'");
        let Watched = await DButils.execQuery("SELECT * FROM watched where username='" + user_id+"' and id_recipe='"+recipes[i]["id"]+"'");
        recipes[i]["isPrefered"] = false ;
        recipes[i]["isWatched"] = false ;
        if (Prefered.length != 0)
            recipes[i]["isPrefered"] = true ;
        if (Watched.length != 0)
            recipes[i]["isWatched"] = true ;
        recipes_objects.push(recipes[i]);
        }

    
    return recipes_objects;

}

exports.pushWatchedPrefered = pushWatchedPrefered;
exports.markasprefered=markasprefered;
exports.isInDB=isInDB;
exports.updateWatched=updateWatched;
exports.addWatched=addWatched;
exports.addRecipePrivate=addRecipePrivate;
exports.addRecipeFamily=addRecipeFamily;
exports.search_recipes=search_recipes;
exports.searchWatchedPrefered=searchWatchedPrefered


