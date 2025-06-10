function create() {
    const nameinput = document.getElementById("rname").value;
    const ingredientinput = document.getElementById("ringredients").value;

    if (!nameinput || !ingredientinput) {
        alert("Minden mezőt ki kell tölteni!");
        return;
    }

    const createreq = new XMLHttpRequest();
    createreq.open("POST", "/recipes");
    createreq.setRequestHeader("Content-Type", "application/json");

    createreq.send(JSON.stringify({
        name: nameinput,
        ingredients: ingredientinput,
    }));

    createreq.onreadystatechange = () => {
        if (createreq.readyState === 4) {
            alert("Recept létrehozva!");
            document.getElementById("rname").value = '';
            document.getElementById("ringredients").value = '';
        }
    };
}


function Load() {
    const loadreq = new XMLHttpRequest();
    loadreq.open('get', '/recipes');
    loadreq.send();
    loadreq.onreadystatechange = () => {
        if (loadreq.readyState === 4 && loadreq.status === 200) {
            const result = JSON.parse(loadreq.response);
            const osszesDiv = document.getElementById('osszes');
            osszesDiv.innerHTML = '<p>Összes recept:</p><button onclick="Load()">Frissítés</button>';

            result.forEach(item => {
                const recipeDiv = document.createElement('div');
                const nameParagraph = document.createElement('p');
                const detailsButton = document.createElement('button');

                nameParagraph.innerText = item.name;
                detailsButton.innerText = "Részletek";
                detailsButton.onclick = () => showRecipeDetails(item.id);



                recipeDiv.appendChild(nameParagraph);
                recipeDiv.appendChild(detailsButton);
                osszesDiv.appendChild(recipeDiv);

                const deleteButton = document.createElement('button');
                deleteButton.innerText = 'Törlés';
                deleteButton.onclick = () => deleteRecipe(item.id);
                recipeDiv.appendChild(deleteButton);

                osszesDiv.appendChild(recipeDiv);
            });
        }
    };
}

function showRecipeDetails(id) {
    const detailReq = new XMLHttpRequest();
    detailReq.open('GET', `/recipes/${id}`);
    detailReq.send();
    detailReq.onreadystatechange = () => {
        if (detailReq.readyState === 4) {
            const detailsDiv = document.getElementById('recipeDetails');
            if (!detailsDiv) {
                console.error("A 'recipeDetails' elem nem található!");
                return;
            }
            if (detailReq.status === 200) {
                const recipe = JSON.parse(detailReq.response);
                detailsDiv.innerHTML = `
                    <h3>${recipe.name}</h3>
                    <p>ID: ${recipe.id}</p>
                    <p>Összetevők: ${recipe.ingredients}</p>
                `;
            } else {
                detailsDiv.innerHTML = "<p>Hiba a recept betöltésekor.</p>";
            }
        }
    };
}

function deleteRecipe(id) {
    const deleteReq = new XMLHttpRequest();
    deleteReq.open("DELETE", `/recipes/${id}`);
    deleteReq.send();
    deleteReq.onreadystatechange = () => {
        if (deleteReq.readyState === 4) {
            const response = JSON.parse(deleteReq.responseText);
            alert(response.message);
            Load();
        }
    };
}



function searchByName() {
  const query = document.getElementById('searchInput').value;
  const searchreq = new XMLHttpRequest();
  searchreq.open('GET', `/recipes/title/${encodeURIComponent(query)}`);
  searchreq.send();
  searchreq.onreadystatechange = () => {
    if (searchreq.readyState === 4) {
      const list = JSON.parse(searchreq.responseText);
      const container = document.getElementById('searchResults');
      container.innerHTML = '<h3>Keresés eredménye:</h3>';
      if (searchreq.status === 200 && list.length) {
        list.forEach(item => {
          const div = document.createElement('div');
          div.innerHTML = `<strong>${item.name}</strong>: ${item.ingredients}`;
          container.appendChild(div);
        });
      } else {
        container.innerHTML += '<p>Nincs találat.</p>';
      }
    }
  };
}

function edit() {
    const recipeId = parseInt(document.getElementById('editId').value);
    const newName = document.getElementById('ename').value;
    const newIngredients = document.getElementById('eing').value;

    if (isNaN(recipeId)) {
        alert("Érvénytelen recept ID!");
        return;
    }

    const editReq = new XMLHttpRequest();
    editReq.open("PUT", `/recipes/${recipeId}`);
    editReq.setRequestHeader('Content-Type', 'application/json');
    editReq.send(JSON.stringify({
        name: newName,
        ingredients: newIngredients
    }));

    editReq.onreadystatechange = () => {
        if (editReq.readyState === 4) {
            const response = JSON.parse(editReq.responseText);
            alert(response.message);
            Load();
        }
    };
}


function reg() {
    const username = document.getElementById('regname').value;
    const password = document.getElementById('rpass').value;
    
    const regReq = new XMLHttpRequest();
    regReq.open("POST", "/users/register");
    regReq.setRequestHeader("Content-Type", "application/json");
    regReq.send(JSON.stringify({ username, password }));
    
    regReq.onreadystatechange = () => {
        if (regReq.readyState === 4) {
            const response = JSON.parse(regReq.responseText);
            if (regReq.status === 201) {
                alert(response.message + " Felhasználó ID: " + response.userId);
            } else {
                alert("Hiba: " + response.message);
            }
        }
    };
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const loginReq = new XMLHttpRequest();
    loginReq.open("POST", "/auth/login");
    loginReq.setRequestHeader("Content-Type", "application/json");
    loginReq.send(JSON.stringify({ username, password }));
    
    loginReq.onreadystatechange = () => {
        if (loginReq.readyState === 4) {
            const response = JSON.parse(loginReq.responseText);
            if (loginReq.status === 200) {
                alert(response.message);
                localStorage.setItem('jwtToken', response.token);
            } else {
                alert("Hiba: " + response.message);
            }
        }
    };
}

function getProfile() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        alert("Először jelentkezz be!");
        return;
    }
    
    const profileReq = new XMLHttpRequest();
    profileReq.open("GET", "/users/me");
    profileReq.setRequestHeader("Authorization", `Bearer ${token}`);
    profileReq.send();
    
    profileReq.onreadystatechange = () => {
        if (profileReq.readyState === 4) {
            const profileDiv = document.getElementById('profileDetails');
            if (profileReq.status === 200) {
                const user = JSON.parse(profileReq.responseText);
                profileDiv.innerHTML = `
                    <p>Felhasználónév: ${user.username}</p>
                    <p>Regisztráció ideje: ${new Date(user.createdAt).toLocaleDateString()}</p>
                `;
            } else {
                profileDiv.innerHTML = "<p>Hiba a profil betöltésekor.</p>";
            }
        }
    };
}

function addIngredientFromForm() {
    const recipeId = document.getElementById("ingredientRecipeId").value;
    const name = document.getElementById("newIngredient").value;

    if (!recipeId || !name) {
        alert("Kérlek, add meg a recept ID-ját és a hozzávaló nevét.");
        return;
    }

    const req = new XMLHttpRequest();
    req.open("POST", `/recipes/${recipeId}/ingredients`);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({ name }));

    req.onreadystatechange = () => {
        if (req.readyState === 4) {
            const res = JSON.parse(req.responseText);
            alert(res.message);
            document.getElementById("newIngredient").value = "";
        }
    };
}

async function viewIngredients() {
    const id = document.getElementById("viewIngredientsId").value;

    const res = await fetch(`/recipes/${id}`);
    if (!res.ok) {
        document.getElementById("ingredientsList").innerText = "Nem található recept vagy hiba történt!";
        return;
    }

    const recipe = await res.json();
    const parts = recipe.ingredients.split(',').map(item => item.trim());
    const list = parts.map(item => `<li>${item}</li>`).join("");

    document.getElementById("ingredientsList").innerHTML = `<ul>${list}</ul>`;
}

async function deleteIngredientFromRecipe() {
    const recipeId = document.getElementById("deleteFromRecipeId").value;
    const ingredientToDelete = document.getElementById("ingredientToDelete").value.trim().toLowerCase();

    const recipeRes = await fetch(`/recipes/${recipeId}`);
    if (!recipeRes.ok) {
        document.getElementById("ingredientDeleteMsg").innerText = "Recept nem található.";
        return;
    }

    const recipe = await recipeRes.json();
    let ingredients = recipe.ingredients
        .split(',')
        .map(i => i.trim())
        .filter(i => i.toLowerCase() !== ingredientToDelete);

    const updatedIngredients = ingredients.join(', ');

    const updateRes = await fetch(`/recipes/${recipeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: recipe.name, ingredients: updatedIngredients })
    });

    const result = await updateRes.json();
    document.getElementById("ingredientDeleteMsg").innerText = result.message || "Törlés sikertelen";
}

function searchByCategory() {
    const category = document.getElementById('categoryInput').value;
    const req = new XMLHttpRequest();
    req.open('GET', `/recipes?category=${encodeURIComponent(category)}`);
    req.send();

    req.onreadystatechange = () => {
        if (req.readyState === 4) {
            const container = document.getElementById('categoryResults');
            container.innerHTML = '<h3>Kategória szerinti találatok:</h3>';
            if (req.status === 200) {
                const recipes = JSON.parse(req.responseText);
                if (recipes.length === 0) {
                    container.innerHTML += '<p>Nincs találat.</p>';
                } else {
                    recipes.forEach(recipe => {
                        const div = document.createElement('div');
                        div.innerHTML = `<strong>${recipe.name}</strong>: ${recipe.ingredients}`;
                        container.appendChild(div);
                    });
                }
            } else {
                container.innerHTML += '<p>Hiba a lekérdezés során.</p>';
            }
        }
    };
}

function searchByIngredient() {
    const ingredient = document.getElementById('ingredientInput').value;
    const req = new XMLHttpRequest();
    req.open('GET', `/recipes?ingredient=${encodeURIComponent(ingredient)}`);
    req.send();

    req.onreadystatechange = () => {
        if (req.readyState === 4) {
            const container = document.getElementById('ingredientResults');
            container.innerHTML = '<h3>Hozzávaló szerinti találatok:</h3>';
            if (req.status === 200) {
                const recipes = JSON.parse(req.responseText);
                if (recipes.length === 0) {
                    container.innerHTML += '<p>Nincs találat.</p>';
                } else {
                    recipes.forEach(recipe => {
                        const div = document.createElement('div');
                        div.innerHTML = `<strong>${recipe.name}</strong>: ${recipe.ingredients}`;
                        container.appendChild(div);
                    });
                }
            } else {
                container.innerHTML += '<p>Hiba a lekérdezés során.</p>';
            }
        }
    };
}

function loadPopularCategories() {
    const req = new XMLHttpRequest();
    req.open('GET', '/categories/popular');
    req.send();

    req.onreadystatechange = () => {
        if (req.readyState === 4) {
            const container = document.getElementById('popularCategories');
            container.innerHTML = '<h3>Legnépszerűbb kategóriák:</h3>';
            if (req.status === 200) {
                const categories = JSON.parse(req.responseText);
                if (categories.length === 0) {
                    container.innerHTML += '<p>Nincs adat.</p>';
                } else {
                    const list = document.createElement('ul');
                    categories.forEach(cat => {
                        liText = `${cat.category.name} (${cat.count} recept)`;
                        const li = document.createElement('li');
                        li.innerText = liText;
                        list.appendChild(li);
                    });
                    container.appendChild(list);
                }
            } else {
                container.innerHTML += '<p>Hiba a kategóriák lekérdezésekor.</p>';
            }
        }
    };
}

function loadCategories() {
    const req = new XMLHttpRequest();
    req.open("GET", "/categories");
    req.send();

    req.onreadystatechange = () => {
        if (req.readyState === 4) {
            const container = document.getElementById("categoryList");
            container.innerHTML = "<h3>Kategóriák:</h3>";
            if (req.status === 200) {
                const categories = JSON.parse(req.responseText);
                const list = document.createElement('ul');
                categories.forEach(cat => {
                    const li = document.createElement('li');
                    li.innerText = `${cat.id} - ${cat.name}`;
                    list.appendChild(li);
                });
                container.appendChild(list);
                const select = document.getElementById("rcategory");
                if (select) {
                    select.innerHTML = '';
                    categories.forEach(cat => {
                        const option = document.createElement("option");
                        option.value = cat.id;
                        option.textContent = cat.name;
                        select.appendChild(option);
                    });
                }
            } else {
                container.innerHTML += "<p>Hiba a kategóriák lekérdezésekor.</p>";
            }
        }
    };
}

function createCategory() {
    const name = document.getElementById("categoryName").value;
    if (!name) {
        alert("Adj meg egy kategóriannevet!");
        return;
    }

    const req = new XMLHttpRequest();
    req.open("POST", "/categories");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({ name }));

    req.onreadystatechange = () => {
        if (req.readyState === 4) {
            const res = JSON.parse(req.responseText);
            alert(res.message || "Kategória létrehozva.");
            loadCategories();
            document.getElementById("categoryName").value = '';
        }
    };
}

function assignCategoryToRecipe() {
    const recipeId = document.getElementById("assignRecipeId").value;
    const categoryId = document.getElementById("assignCategoryId").value;

    if (!recipeId || !categoryId) {
        alert("Add meg a recept ID-ját és a kategória ID-ját!");
        return;
    }

    const req = new XMLHttpRequest();
    req.open("PUT", `/recipes/${recipeId}/category`);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({ categoryId }));

    req.onreadystatechange = () => {
        if (req.readyState === 4) {
            const res = JSON.parse(req.responseText);
            alert(res.message || "Kategória hozzárendelve.");
        }
    };
}


window.onload = () => {
    loadCategories();
};
