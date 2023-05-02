const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const port = process.env.PORT || 8080;
const app = express();
const db = new sqlite3.Database(__dirname + '/database.sqlite', (error) => {
	if (error) {
		return console.error(error.message);
	}
});

app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: true
	})
);
app.use(cookieParser());

// Cookie expires after 15 minutes
// Free cookie endpoint
app.get('/free-cookie', (req, res) => {
	res.clearCookie('user_type');
	res.cookie('user_type', 'free', {
		maxAge: 900000
	});
	res.send('Cookie is set user_type=free');
});

// Premium cookie endpoint
app.get('/premium-cookie', (req, res) => {
	res.clearCookie('user_type');
	res.cookie('user_type', 'premium', {
		maxAge: 900000
	});
	res.send('Cookie is set user_type=premium');
});

// Admin cookie endpoint
app.get('/admin-cookie', (req, res) => {
	res.clearCookie('user_type');
	res.cookie('user_type', 'admin', {
		maxAge: 900000
	});
	res.send('Cookie is set user_type=admin');
});

// If there is a need to clear cookies, this will remove them
app.get('/clear-cookie', (req, res) => {
	res.clearCookie('user_type');
	res.send('Cookies was cleared');
});

// FT01 - List Recipes
app.get('/recipes', (req, res) => {
	let data = [];
	let recipes = [];
	let user = req.cookies?.user_type;
	if (user === 'free') {
		// Lists free recipes
		db.serialize(() => {
			db.each(
				`SELECT name, recipe_id FROM recipes WHERE category="${user}";`,
				(error, row) => {
					if (error) {
						return console.error(error.message);
					}
					recipes.push(row);
					// Sorts the recipes by id
					recipes.sort(function (a, b) {
						return a.recipe_id - b.recipe_id;
					});
				},
				() => {
					if (recipes.length < 1) {
						// If there are no recipes
						res.status(404).json({
							Error: 'No recipes found'
						});
					} else {
						data.push(recipes);
						res.status(200).send(data);
					}
				}
			);
		});
	} else if (user === 'admin' || user === 'premium') {
		// Lists premium recipes
		db.serialize(() => {
			db.each(
				`SELECT name, recipe_id FROM recipes`,
				(error, row) => {
					if (error) {
						return console.error(error.message);
					}
					recipes.push(row);
					// Sorts the recipes by id
					recipes.sort(function (a, b) {
						return a.recipe_id - b.recipe_id;
					});
				},
				() => {
					if (recipes.length < 1) {
						// If there are no recipes
						res.status(404).json({
							Error: 'No recipes found'
						});
					} else {
						data.push(recipes);
						res.status(200).send(data);
					}
				}
			);
		});
	} else {
		// If cookie is not set
		res.status(403).send('Please set your cookies! See README.md');
	}
});

// FT02 - Overview of Steps
app.get('/recipe/:recipe_id', (req, res) => {
	let data = [];
	let steps = [];
	let recipe_id = req.params.recipe_id;
	let user = req.cookies?.user_type;
	if (user) {
		db.serialize(() => {
			db.each(
				// Checks if there are any recipes with id `recipe_id`
				`SELECT EXISTS(SELECT 1 FROM recipes WHERE recipe_id='${recipe_id}') AS result;`,
				(error, row) => {
					if (error) {
						return console.error(error.message);
					}
					if (row.result === 1) {
						if (user === 'free') {
							// Lists free recipes
							db.serialize(() => {
								db.each(
									`SELECT name FROM recipes WHERE recipe_id="${recipe_id}" AND category="${user}";`,
									(error, row) => {
										if (error) {
											return console.error(error.message);
										}
										data.push(row);
										getData(recipe_id);
									}
								);
							});
						}
						if (user === 'admin' || user === 'premium') {
							// Lists premium recipes
							db.serialize(() => {
								db.each(`SELECT name FROM recipes WHERE recipe_id="${recipe_id}";`, (error, row) => {
									if (error) {
										return console.error(error.message);
									}
									data.push(row);
									getData(recipe_id);
								});
							});
						} else {
							// If the cookie is free
							res.status(401).json({
								Error: 'You do not have access to recipe: ' + recipe_id
							});
						}
					} else {
						// If there are any recipes with id `recipe_id`
						res.status(404).json({
							Error: 'There is no recipe with id: ' + recipe_id
						});
					}
				}
			);
		});

		// recipe_id as param
		const getData = (id) => {
			// Entry and type with id from param
			db.each(`SELECT entry, type FROM ingredients WHERE recipe_id="${id}";`, (error, row) => {
				if (error) {
					return console.error(error.message);
				}
				data.push(row);
			}),
				db.each(
					// Step_id with id from param
					`SELECT step_id FROM steps WHERE recipe_id="${id}";`,
					(error, row) => {
						if (error) {
							return console.error(error.message);
						}
						steps.push(row);
					},
					() => {
						// Counts number of steps
						data.push('step_count: ' + steps.length);
						res.status(200).send(data);
					}
				);
		};
	} else {
		// If cookie is not set
		res.status(403).json({
			Error: 'Please set your cookies! See README.md'
		});
	}
});

// FT03 - Detailed Steps, Return entire entry
app.get('/recipe/:recipe_id/all', (req, res) => {
	let recipe_id = req.params.recipe_id;
	let user = req.cookies?.user_type;
	let data = [];
	let steps = [];
	let ingredients = [];
	if (user) {
		db.serialize(() => {
			db.each(
				// Checks if there is a recipe with id 'recipe_id'
				`SELECT EXISTS(SELECT 1 FROM recipes WHERE recipe_id='${recipe_id}') AS result;`,
				(error, row) => {
					if (error) {
						return console.error(error.message);
					}
					if (row.result === 1) {
						if (user === 'free') {
							// Free tier recipes
							db.serialize(() => {
								db.each(
									`SELECT name, category FROM recipes WHERE recipe_id="${recipe_id}" AND category="${user}";`,
									(error, row) => {
										if (error) {
											return console.error(error.message);
										}
										data.push(row);
										getData(recipe_id);
									}
								);
							});
						}
						if (user === 'premium' || user === 'admin') {
							// Premium tier recipes
							db.serialize(() => {
								db.each(
									`SELECT name, category FROM recipes WHERE recipe_id="${recipe_id}";`,
									(error, row) => {
										if (error) {
											return console.error(error.message);
										}
										data.push(row);
										getData(recipe_id);
									}
								);
							});
						} else {
							// If a free user tries to access a premium recipe
							res.status(401).json({
								Error: 'Please upgrade account to view this recipe'
							});
						}
					} else {
						// If there is no recipe with recipe_id
						res.status(404).json({
							Error: `There is no recipe with id ${recipe_id}`
						});
					}
				}
			);
		});
	} else {
		// If there is no cookie
		res.status(403).json({
			Error: 'Please set your cookies! See README.md'
		});
	}
	// Recipe_id param
	const getData = (id) => {
		// Had to include ingredient_id, how else would one know the id required for AT03, without going into the table itself?
		db.each(
			`SELECT ingredient_id, entry, type FROM ingredients WHERE recipe_id="${id}";`,
			(error, row) => {
				if (error) {
					return console.error(error.message);
				}
				ingredients.push(row);
			},
			() => {
				// Sorts ingredients by id
				ingredients.sort(function (a, b) {
					return a.ingredient_id - b.ingredient_id;
				});
				data.push('Ingredients', ingredients);
			}
		);

		db.each(
			// Gets steps
			`SELECT step_id, text FROM steps WHERE recipe_id="${id}";`,
			(error, row) => {
				if (error) {
					return console.error(error.message);
				}
				steps.push(row);
			},
			() => {
				// Sorts steps by id
				steps.sort(function (a, b) {
					return a.step_id - b.step_id;
				});
				data.push('Steps', steps);
				res.status(200).send(data);
			}
		);
	};
});

// FT04 - Single Step, selected step from selected recipe
app.get('/recipe/:recipe_id/:step_id', (req, res) => {
	let recipe_id = req.params.recipe_id;
	let user = req.cookies?.user_type;
	let step_id = req.params.step_id;
	let data = [];
	if (user) {
		db.serialize(() => {
			db.each(
				// Checks if there is a recipe with id `recipe_id`
				`SELECT EXISTS(SELECT 1 FROM recipes WHERE recipe_id='${recipe_id}') AS result;`,
				(error, row) => {
					if (error) {
						return console.error(error.message);
					}
					if (row.result === 1) {
						if (user === 'free') {
							// Free tier
							db.serialize(() => {
								db.each(
									// Gets a signle step
									`SELECT step_id, text FROM steps WHERE recipe_id="${recipe_id}" AND step_id="${step_id}";`,
									(error, row) => {
										if (error) {
											return console.error(error.message);
										}
										data.push(row);
									},
									() => {
										if (data.length === 0) {
											// If the step is empty or not existing
											res.status(404).json({
												Error: 'Step not found'
											});
										} else {
											res.status(200).send(data);
										}
									}
								);
							});
						} else if (user === 'premium' || user === 'admin') {
							// Premium tier
							db.serialize(() => {
								db.each(
									// Gets a single step
									`SELECT step_id, text FROM steps WHERE recipe_id="${recipe_id}" AND step_id="${step_id}";`,
									(error, row) => {
										if (error) {
											return console.error(error.message);
										}
										data.push(row);
									},
									() => {
										if (data.length === 0) {
											// If the step is empty or not existing
											res.status(404).json({
												Error: 'Step not found'
											});
										} else {
											res.status(200).send(data);
										}
									}
								);
							});
						} else {
							// If a free user tries to access a premium recipe
							res.status(401).json({
								Error: 'Please upgrade account to view this recipe'
							});
						}
					} else {
						// If there are no recipes with id `recipe_id`
						res.status(404).json({
							Error: `No recipes found with id ${recipe_id}`
						});
					}
				}
			);
		});
	} else {
		// If the cookie is not set
		res.status(403).json({
			Error: 'Please set your cookies! See README.md'
		});
	}
});

// PT02 Search by Ingredient
app.get('/search/:ingredient', (req, res) => {
	let user = req.cookies?.user_type;
	let ingredient = req.params.ingredient;
	let data = {
		search: ingredient,
		results: []
	};
	if (user === 'premium' || user === 'admin') {
		// Premium tier
		db.serialize(() => {
			db.each(
				// Gets every recipe_id with specified ingredient
				`SELECT recipe_id FROM ingredients WHERE type="${ingredient}";`,
				(error, row) => {
					if (error) {
						return console.error(error.message);
					}
					data.results.push('/recipe/' + row.recipe_id);
				},
				() => {
					if (data.results.length === 0) {
						// If there are none of specified ingredient
						res.status(404).json({
							Error: 'No recipes found with the ingredient: ' + ingredient
						});
					} else {
						res.status(200).send(data);
					}
				}
			);
		});
	} else {
		// If someone other than admin of premium user tries to access feature
		res.status(401).json({
			Error: 'Please upgrade account to use this feature'
		});
	}
});

// PT03 - Search Helper
app.get('/ingredients', (req, res) => {
	let user = req.cookies?.user_type;
	let data = {
		ingredients: []
	};
	if (user === 'premium' || user === 'admin') {
		db.serialize(() => {
			db.each(
				`SELECT type FROM ingredients`,
				(error, row) => {
					if (error) {
						return console.error(error.message);
					}
					data.ingredients.push(row.type);
				},
				() => {
					if (data.ingredients.length === 0) {
						// If there are no ingredients
						res.status(404).json({
							Error: 'No ingredients found'
						});
					} else {
						res.status(200).send(data);
					}
				}
			);
		});
	} else {
		// If someone other than admin of premium user tries to access feature
		res.status(401).json({
			Error: 'Please upgrade account to use this feature'
		});
	}
});

// AT02 Add Recipe
app.post('/recipe', (req, res) => {
	let user = req.cookies?.user_type;
	let name = req.body.name;
	let category = req.body.category.toLowerCase();
	let ingredients = req.body.ingredients;
	let steps = req.body.steps;
	let recipe_id = [];

	if (user === 'admin') {
		// Admin feature
		if (category === 'free' || category === 'premium') {
			// Category must be free or premium
			if (name && ingredients && steps) {
				db.each(
					// Looks for recipe with the name
					`SELECT EXISTS(SELECT 1 FROM recipes WHERE name='${name}') AS result;`,
					(error, row) => {
						if (error) {
							return console.error(error.message);
						}
						if (row.result !== 1) {
							// If there are no recipes with the name
							db.run(
								`INSERT INTO recipes (name, category) VALUES ('${name}', '${category}');`,
								(error) => {
									if (error) {
										return console.error(error.message);
									}
								}
							);
							// Gets the id from recipe table and uses it on the step and ingredient tables
							db.each(`SELECT recipe_id FROM recipes WHERE name="${name}";`, (error, row) => {
								if (error) {
									return console.error(error.message);
								} else {
									recipe_id.push(row.recipe_id);
									setChildren(recipe_id);
								}
							});
							// Param is recipe_id
							const setChildren = (id) => {
								// Adds the ingredients to ingredient table, using for loops to give ingredient_id a number
								for (let i = 0; i < ingredients.length; i++) {
									db.run(
										`INSERT INTO ingredients (recipe_id, ingredient_id, entry, type) VALUES ('${id}', '${
											i + 1
										}', '${ingredients[i].entry}', '${ingredients[i].type}');`
									);
								}
								// Adds the text to steps table, using for loops to give steps_id a number
								for (let i = 0; i < steps.length; i++) {
									db.run(
										`INSERT INTO steps (recipe_id, step_id, text) VALUES ('${id}', '${i + 1}', '${
											steps[i].text
										}');`
									);
								}
								// Success!
								res.status(200).send('Recipe successfully added to table!');
							};
						} else {
							// If there exists a recipe with the name
							res.status(409).json({
								Error: 'A recipe with that name already exists'
							});
						}
					}
				);
			} else {
				// If the recipe does not include name, ingredients, or
				res.status(409).json({
					Error:
						'Please make sure you have included name, ingredients and steps, if you have uncertainties, please view the README.md'
				});
			}
		} else {
			// If the category is something else than free or premium
			res.status(409).json({ Error: 'Please choose a valid category' });
		}
	} else {
		// If the user is unauthorized
		res.status(401).json({
			Error: 'Only administrators can use this feature'
		});
	}
});

// AT03 Update Recipe
app.patch('/recipe/:recipe_id', (req, res) => {
	let recipe_id = req.params.recipe_id;
	let user = req.cookies?.user_type;
	let name = req.body.name;
	let category = req.body.category;
	let entry = req.body.entry;
	let type = req.body.type;
	let ingredient_id = req.body.ingredient_id;
	let text = req.body.text;
	let step_id = req.body.step_id;
	if (user === 'admin') {
		// Admin feature
		db.serialize(() => {
			db.each(
				// Checks if there is a recipe with the specified id
				`SELECT EXISTS(SELECT 1 FROM recipes WHERE recipe_id='${recipe_id}') AS result`,
				(error, row) => {
					if (row.result === 1) {
						if (name) {
							// If the admin has included a name
							db.all(`UPDATE recipes SET name="${name}" WHERE recipe_id="${recipe_id}";`, (error) => {
								if (error) {
									return console.error(error.message);
								}
							});
						}
						if ((category && category === 'free') || category === 'premium') {
							// If the admin has included a category
							db.all(
								`UPDATE recipes SET category="${category}" WHERE recipe_id="${recipe_id}";`,
								(error) => {
									if (error) {
										return console.error(error.message);
									}
								}
							);
						}
						if (entry) {
							// If the admin has included an entry
							db.all(
								`UPDATE ingredients SET entry="${entry}" WHERE recipe_id="${recipe_id}" AND ingredient_id="${ingredient_id}";`,
								(error) => {
									if (error) {
										return console.error(error.message);
									}
								}
							);
						}
						if (type) {
							// If the admin has included a type
							db.all(
								`UPDATE ingredients SET type="${type}" WHERE recipe_id="${recipe_id}" AND ingredient_id="${ingredient_id}";`,
								(error) => {
									if (error) {
										return console.error(error.message);
									}
								}
							);
						}

						if (text) {
							// If the admin has included a text
							db.all(
								`UPDATE steps SET text="${text}" WHERE recipe_id="${recipe_id}" AND step_id="${step_id}";`,
								(error) => {
									if (error) {
										return console.error(error.message);
									}
								}
							);
						}
					} else {
						// If there are no recipes with the recipe_id set
						res.status(404).json({
							Error: 'Could not find any recipes with id' + recipe_id
						});
					}
					if (error) {
						return console.error(error.message);
					} else {
						// If successful
						res.status(200).json({
							Message: `Updated`
						});
					}
				}
			);
		});
	} else {
		// If someone else than admins try to access feature
		res.status(401).json({
			Error: 'Only administrators can use this feature'
		});
	}
});

//AT04 Replace Recipe
app.put('/recipe/:recipe_id', (req, res) => {
	let user = req.cookies?.user_type;
	let name = req.body.name;
	let category = req.body.category.toLowerCase();
	let ingredients = req.body.ingredients;
	let steps = req.body.steps;
	let recipe_id = req.params.recipe_id;
	let data = [];
	if (user === 'admin') {
		// Admin feature
		db.serialize(() => {
			db.each(
				// Checks if there is a recipe with the specified id
				`SELECT EXISTS(SELECT 1 FROM recipes WHERE recipe_id='${recipe_id}') AS result`,
				(error, row) => {
					if (error) {
						return console.error(error.message);
					}
					if (row.result === 1) {
						if (name) {
							db.all(
								// Changes recipe name and category
								`UPDATE recipes SET name="${name}", category="${category}" WHERE recipe_id="${recipe_id}";`,
								(error) => {
									if (error) {
										return console.error(error.message);
									}
								}
							);
							// Removes ingredients related to the old recipe
							db.run(`DELETE FROM ingredients WHERE recipe_id = "${recipe_id}";`, function (error) {
								if (error) return console.error(error.message);
								setIngredients(recipe_id);
							});
							// Removes steps related to the old recipe
							db.run(`DELETE FROM steps WHERE recipe_id = "${recipe_id}";`, function (error) {
								if (error) return console.error(error.message);
								setSteps(recipe_id);
							});
							// Param is recipe_id
							const setIngredients = (id) => {
								// Adds the ingredients to ingredient table, using for loops to give ingredient_id a number
								for (let i = 0; i < ingredients.length; i++) {
									db.run(
										`INSERT INTO ingredients (recipe_id, ingredient_id, entry, type) VALUES ('${id}', '${
											i + 1
										}', '${ingredients[i].entry}', '${ingredients[i].type}');`,
										(error) => {
											if (error) {
												return console.error(error.message);
											}
										}
									);
								}
							};
							// Param is recipe_id
							const setSteps = (id) => {
								// Adds the step to steps table, using for loops to give step_id a number
								for (let i = 0; i < steps.length; i++) {
									db.run(
										`INSERT INTO steps (recipe_id, step_id, text) VALUES ('${id}', '${i + 1}', '${
											steps[i].text
										}');`,
										(error) => {
											if (error) {
												return console.error(error.message);
											}
										}
									);
								}
								// If success
								res.status(200).send('Recipe successfully replaced!');
							};
						}
					} else {
						// If there are no recipes with the id
						res.status(404).json({
							Error: 'Could not find any recipes with id' + recipe_id
						});
					}
				}
			);
		});
	} else {
		// If someone other than admins try to access the feature
		res.status(401).json({
			Error: 'Only administrators can use this feature'
		});
	}
});

//AT04 Delete Recipe
app.delete('/recipe/:recipe_id', (req, res) => {
	const recipe_id = req.params.recipe_id;
	let user = req.cookies?.user_type;
	if (user === 'admin') {
		db.serialize(() => {
			db.each(
				// Checks if there is a recipe with specified id
				`SELECT EXISTS(SELECT 1 FROM recipes WHERE recipe_id='${recipe_id}') AS result`,
				(error, row) => {
					if (error) {
						return console.error(error.message);
					}
					if (row.result === 1) {
						// Deletes from recipe table where the reicpe_id matches
						db.run(`DELETE FROM recipes WHERE recipe_id = "${recipe_id}";`, function (error) {
							if (error) return console.error(error.message);
						}), // Deletes from steps table where the reicpe_id matches
							db.run(`DELETE FROM steps WHERE recipe_id = "${recipe_id}";`, function (error) {
								if (error) return console.error(error.message);
							}), // Deletes from ingredients table where the reicpe_id matches
							db.run(`DELETE FROM ingredients WHERE recipe_id = "${recipe_id}";`, function (error) {
								if (error) return console.error(error.message);
							}),
							// If successful
							res.status(200).send('Deleted recipe with id ' + recipe_id);
					} else {
						// If no recipe found with the id
						res.status(404).json({
							Error: 'Could not find any recipes with id ' + recipe_id
						});
					}
				}
			);
		});
	} else {
		// If someone else than admins try to access the feature
		res.status(401).json({
			Error: 'Only administrators can use this feature'
		});
	}
});

app.listen(port, () => console.log('Server is running on port:', port));
