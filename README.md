# Recipe database

## Setting up dependencies 

| Name | Description | Terminal |
| - | - | - |
| SQlite | Lightweigth API used to store data | npm i sqlite3 |
| Express | Allows debelopers to create all kinds ov server-side tools and applications in javascript | npm i express |
| Body-parser | Parse incoming request bodies in a middleware before your handlers, available with the req.body property | npm i body-parser |
| Nodemon | Simple monitor script for use during development of a node.js application | npm i nodemon |
| Cookie-parser | Parse Cookie header and populate req.cookies with an object keyed by the cookie names. | npm i cookie-parser |

<br>
<br>

### Postman

This application is configured to be use with [Postman](https://www.postman.com/downloads/) and takes advantage of postmans ability to use GET, POST, PATCH, PUT and DELETE methods.

<br>
<br>

### Database

To view the database in its entirety you can use [DB Browser for SQLite](https://sqlitebrowser.org/dl/).

<br>
<br>

### Start server

To start the server use the following in the terminal

```
npm start
```

<br>
<br>

# Usage

With this application, you will get access to food recipes. There are three levels of access, first the basic **FREE** users. The **FREE** users will only get access to the **FREE** recipes and **FREE** features.

The next level is **PREMIUM**, as a **PREMIUM** user you get access to all the recipes.

And lastly the **ADMIN**. As an admin **ADMIN** you get to add, update, replace and delete recipes.

<br>
<br>

# Free users

## Cookie

To gain access to the **FREE** features, use the following endpoint:

### Method: 

```
GET
```

### URL:

```
localhost:8080/free-cookie
```

Cookie expires after 15 minutes.

<br>
<br>
<br>
<br>

# FT01 - List Recipes

Will list different recipes depending on the cookie.

### Method: 

```
GET
```

### URL:

```
localhost:8080/recipes
```

Premium users will get more options.

<br>
<br>
<br>
<br>

# FT02 - Overview of Steps

Lists steps of recipe.\
Free users can't see premium recipes.

### Method: 

```
GET
```

### URL:

```
localhost:8080/recipe/:recipe_id
```

### Example URL: 

```
localhost:8080/recipe/1
```



<br>
<br>
<br>
<br>

## FT03 - Detailed Steps

Lists the recipe in its entirety.\
Free users can't see premium recipes.

Method:

```
GET
```

URL: 

```
localhost:8080/recipe/:recipe_id/all
```

Example URL: 

```
localhost:8080/recipe/1/all
```



<br>
<br>
<br>
<br>

## FT04 - Single Step

Lists a single step of a recipe.\
Free users can't see premium recipes.

Method: 

```
GET
```

URL:

```
localhost:8080/recipe/:recipe_id/:step_id
```

Example URL: 

```
localhost:8080/recipe/1/3
```

<br>
<br>
<br>
<br>

# Premium users

## Cookie

To gain access to the **PREMIUM** features, use the following endpoint:

Method: 

```
GET
```

URL: 

```
localhost:8080/premium-cookie
```

Cookie expires after 15 minutes.

<br>
<br>
<br>
<br>

## PT02 - Search by Ingredient

Lists every recipe with specified ingredient.\
Only available to premium users.

Method: 

```
GET
```

URL: 

```
localhost:8080/search/:ingredient
```

Example URL: 

```
localhost:8080/search/butter
```
Lists all recipes with butter as an ingredient.

<br>
<br>
<br>
<br>

## PT03 - Search Helper

Lists all ingredients used in all the recipes.\
Only available to premium users.

Method: 

```
GET
```

URL: 

```
localhost:8080/ingredients
```


<br>
<br>
<br>
<br>

## Administrator users

## Cookie

To gain access to the administrator features, use the following endpoint using:

Method: 

```
GET
```

URL: 

```
localhost:8080/admin-cookie
```

Cookie expires after 15 minutes.

<br>
<br>
<br>
<br>

## AT02 - Add Recipe

Adds a new recipe.\
Only available to admin users.

Method: 

```
POST
```

URL:

```
localhost:8080/recipe
```

To add recipe, send the recipe as json in body.

Example body:


```json
{
    "name": "Pasta carbonara",
    "category": "free",
    "ingredients":
    [
        {
            "entry": "400g spaghetti",
            "type": "spaghetti"
        },
        {
            "entry": "150g pancetta",
            "type": "pancetta"
        }
    ],
    "steps":
    [
        {
            "text": "Boil water"
        },
        { 
            "text": "Finely dice the pancetta"
        }
    ]
}
```

Adds a recipe to the database.\
Recipe_id, ingredient_id and step_id are automatically generated.
 
<br>
<br>
<br>
<br>

## AT03 - Update Recipe

Updates an existing recipe.\
Only available to admin users.

Method: 

```
PATCH
```

URL: 

```
localhost:8080/recipe/:recipe_id
```

Example URL: 

```
localhost:8080/recipe/1
```

Updates existing recipe with id 1.

To update, send as json in body.

Example body:

```json
    {
        "name": "Pie",
        "category": "free",
        "entry": "350g sugar",
        "type": "sugar",
        "ingredient_id": 3,
        "step_id": 4,
        "text": "Mix dry ingredients"
    }
```

You **MUST** include ingredient_id if you wish to update entry or type, and step_id if you want to update text.\
If you don't know the ingredient_id or step_id, you can use **localhost:8080/recipe/:recipe_id/all** using **GET** method.


<br>
<br>
<br>
<br>

## AT04 - Replace Recipe

Replaces an existing recipe.\
Only available to admin users.

Method: 

```
PUT
```

URL: 

```
localhost:8080/recipe/:recipe_id
```

Example URL: 

```
localhost:8080/recipe/1
```

Replaces existing recipe with id 1 with a new one.

To replace, send the new recipe as json in body.

Example body:

```json
{
    "name":"Cake",
    "category":"premium",
    "ingredients":
    [
        {
            "entry":"50g butter",
            "type":"butter"
        },
        {
            "entry":"1 chopped onion",
            "type":"onion"
        }
    ],
    "steps":
    [
        {
            "text":"Heat oven to 200C/180C fan/gas 6."
        },
        { 
            "text":"Put the butter in a medium-size saucepan and place over a medium heat."
        }
    ]
}
```
 
<br>
<br>
<br>
<br>

## AT05 - Delete Recipes

Deletes an existing recipe.\
Only available to admin users.

Method: 

```
DELETE
```

URL: 

```
localhost:8080/recipe/:recipe_id
```

Example URL: 

```
localhost:8080/recipe/1
```

Deletes recipe with id 1
