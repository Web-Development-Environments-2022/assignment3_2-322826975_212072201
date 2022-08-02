const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}


async function getRecipeDetails(recipe_id) {
    try{
        let recipe_info = await getRecipeInformation(recipe_id);
        let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

        return {
            id: id,
            title: title,
            time_to_cook: readyInMinutes,
            image: image,
            popularity: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            gluten_free_sign: glutenFree,
            
        }    
    }
    catch(error){
        return;
    }
}

async function getFullRecipeDetails(recipe_id) {
    try{
        let recipe_info = await getRecipeInformation(recipe_id);
        let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree,extendedIngredients,instructions,analyzedInstructions,servings } = recipe_info.data;

        return {
            id: id,
            title: title,
            time_to_cook: readyInMinutes,
            image: image,
            popularity: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            gluten_free_sign: glutenFree,
            ingredients_list:extendedIngredients,
            instructions:instructions,
            analyzedInstructions:analyzedInstructions,
            pieces_amount:servings
        }
    }
    catch(error){
        return;
    }
}

async function getRandomRecipes() {
    return await axios.get(`${api_domain}/random`, {
        params: {
            number: 10,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function extractPreviewRecipeDetails(recipes_info) {
    return recipes_info.map((recipe_info) => {
        let data = recipe_info;
        if (recipe_info.data) {
            data = recipe_info.data;
        }
        const {
            id,
            title,
            readyInMinutes,
            image,
            aggregateLikes,
            vegan,
            vegetarian,
            glutenFree,
        } = data;
        return {
            id: id,
            title: title,
            time_to_cook: readyInMinutes,
            image: image,
            popularity: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            gluten_free_sign: glutenFree,
            }
    })
  }
async function get3randoms() {
    let randoms = await getRandomRecipes();
    let filtered_random = randoms.data.recipes.filter((random) => (random.image!="") && (random.time_to_cook!="")&& (random.title!="")&& (random.popularity!="") && (random.analyzedInstructions!=""));
    if (filtered_random.length<3)
        return get3randoms();
    return extractPreviewRecipeDetails([filtered_random[0],filtered_random[1],filtered_random[2]]);

}


async function pushWatchedPrefered(recipes,user_id){
    const users = await DButils.execQuery("SELECT username FROM users");
    let recipes_objects =[];

    if (!users.find((x) => x.username === user_id))
    {
    

      for(let i=0; i<recipes.length; i++)
      {
          recipes[i]["isPrefered"] = false ;
          recipes[i]["isWatched"] = false ;
          recipes_objects.push(recipes[i]);
      }
  
    }
    else
    {
      for(let i=0; i<recipes.length; i++)
      {
          let Prefered = await DButils.execQuery("SELECT * FROM prefered where username='" + user_id+"' and id_recipe='"+recipes[i]["id"]+"'");
          let Watched = await DButils.execQuery("SELECT * FROM watched where username='" + user_id+"' and id_recipe='"+recipes[i]["id"]+"'");
          recipes[i]["isPrefered"] = false;
          recipes[i]["isWatched"] =false;
          if (Prefered.length != 0)
            recipes[i]["isPrefered"]=true;
          if (Watched.length != 0)
            recipes[i]["isWatched"] =true;
          recipes_objects.push(recipes[i]);
      }  
    }
    return recipes_objects;

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
            let recipe_info = await getRecipeInformation(recipes.data.results[j]["id"]);
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

exports.getRecipeDetails = getRecipeDetails;
exports.get3randoms = get3randoms;
exports.getFullRecipeDetails = getFullRecipeDetails;
exports.pushWatchedPrefered=pushWatchedPrefered;
exports.getRecipeInformation=getRecipeInformation;
exports.searchWatchedPrefered=searchWatchedPrefered;
exports.search_recipes=search_recipes;