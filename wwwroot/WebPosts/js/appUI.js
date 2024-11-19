const periodicRefreshPeriod = 10;
let contentScrollPosition = 0;
let selectedCategory = "";
let currentETag = "";
let hold_Periodic_Refresh = false;
let search = "";

Init_UI();

function Init_UI() {
    $("#search").show();
    $("#searchKey").on("input", () => {
        doSearch();
    });

    $('#doSearch').on('click', () => {
        doSearch();
    });

    renderWebPosts();
    $('#createWebPost').on("click", async function () {
        saveContentScrollPosition();
        renderCreateWebPostForm();
    });
    $('#abort').on("click", async function () {
        renderWebPosts();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    

    start_Periodic_Refresh();
}
function doSearch() {
    search = $("#searchKey").val().trim();
    renderWebPosts();
}
function start_Periodic_Refresh() {
    setInterval(async () => {
        if (! hold_Periodic_Refresh) {
            let etag = await WebPosts_API.HEAD();
            if (currentETag != etag) {
                currentETag = etag;
                renderWebPosts();
            }
        }
    },
        periodicRefreshPeriod * 1000);
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#search").hide();
    $("#createWebPost").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de posts</h2>
                <hr>
                <p>
                    Travail évalué TP1.
                </p>
                <p>
                    Auteur: Nicolas Chourot
                    Modifié et remis par Samuel Gourgue
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2024
                </p>
            </div>
        `))
}
function updateDropDownMenu(categories) {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    $('#allCatCmd').on("click", function () {
        selectedCategory = "";
        renderWebPosts();
    });
    $('.category').on("click", function () {
        selectedCategory = $(this).text().trim();
        renderWebPosts();
    });
}

function compileCategories(webposts) {
    let categories = [];
    if (webposts != null) {
        webposts.forEach(webpost => {
            if (!categories.includes(webpost.Category))
                categories.push(webpost.Category);
        })
        updateDropDownMenu(categories);
    }
}
async function renderWebPosts() {
    hold_Periodic_Refresh = false;
    showWaitingGif();
    $("#search").show();
    $("#actionTitle").text("Liste des posts");
    $("#createWebPost").show();
    $("#abort").hide();

    let response = await WebPosts_API.Get();
    if (!WebPosts_API.error) {
        currentETag = response.ETag;
        let WebPosts = response.data;

        WebPosts.sort((a, b) => new Date(b.Creation) - new Date(a.Creation));

        if (search) {
            WebPosts = WebPosts.filter(post =>
                post.Title.toLowerCase().includes(search.toLowerCase()) ||
                post.Text.toLowerCase().includes(search.toLowerCase())
            );
        }

        eraseContent();
        compileCategories(WebPosts);

        WebPosts.forEach(WebPost => {
            if ((selectedCategory === "") || (selectedCategory === WebPost.Category)) {
                $("#content").append(renderWebPost(WebPost));
            }
        });

        restoreContentScrollPosition();

        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditWebPostForm($(this).attr("editWebPostId"));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeleteWebPostForm($(this).attr("deleteWebPostId"));
        });
    } else {
        renderError(WebPosts_API.currentHttpError);
    }
}

function showWaitingGif() {
    $("#content").empty();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreateWebPostForm() {
    renderWebPostForm();
}
async function renderEditWebPostForm(id) {
    showWaitingGif();
    let response = await WebPosts_API.Get(id)
    let WebPost = response.data;
    if (WebPost !== null)
        renderWebPostForm(WebPost);
    else
        renderError("WebPost introuvable!");
}
async function renderDeleteWebPostForm(id) {
    showWaitingGif();
    $("#search").hide();
    $("#createWebPost").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let response = await WebPosts_API.Get(id)
    let WebPost = response.data;
    eraseContent();
    if (WebPost !== null) {
        $("#content").append(`
        <div class="WebPostdeleteForm">
            <h4>Effacer le WebPost suivant?</h4>
            <br>
            <div class="WebPostRow" WebPost_id=${WebPost.Id}">
                <div class="WebPostContainer noselect">
                    <div class="WebPostLayout">
                        <div class="WebPost">
                            <span class="WebPostTitle">${WebPost.Title}</span>
                        </div>
                        <span class="WebPostCategory">${WebPost.Category}</span>
                    </div>
                    <div class="WebPostCommandPanel">
                        <span class="editCmd cmdIcon fa fa-pencil" editWebPostId="${WebPost.Id}" title="Modifier ${WebPost.Title}"></span>
                        <span class="deleteCmd cmdIcon fa fa-trash" deleteWebPostId="${WebPost.Id}" title="Effacer ${WebPost.Title}"></span>
                    </div>
                </div>
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteWebPost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deleteWebPost').on("click", async function () {
            showWaitingGif();
            let result = await WebPosts_API.Delete(WebPost.Id);
            if (result)
                renderWebPosts();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderWebPosts();
        });
    } else {
        renderError("WebPost introuvable!");
    }
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}
function newWebPost() {
    return {
        Id: 0,
        Title: "",
        Text: "",
        Category: "",
        Creation: Date.now()
    };
}

function renderWebPostForm(WebPost = null) {
    $("#search").hide();
    $("#createWebPost").hide();
    $("#abort").show();
    eraseContent();
    hold_Periodic_Refresh = true;

    let isCreate = WebPost == null;
    if (isCreate) {
        WebPost = newWebPost();
        WebPost.Image = "images/no-avatar.png";
    }

    $("#actionTitle").text(isCreate ? "Création" : "Modification");

    $("#content").append(`
        <form class="form" id="WebPostForm">
            <br>
            <input type="hidden" name="Id" value="${WebPost.Id}"/>

            <label for="Title" class="form-label">Titre</label>
            <input 
                class="form-control"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                value="${WebPost.Title}"
            />

            <label for="Text" class="form-label">Texte</label>
            <textarea
                class="form-control"
                name="Text"
                id="Text"
                placeholder="Texte"
                required
            >${WebPost.Text}</textarea>

            <label for="Category" class="form-label">Catégorie</label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${WebPost.Category}"
            />

            <label class="form-label">Image </label>
            <div   class='imageUploader' 
                   newImage='${isCreate}' 
                   controlId='Image' 
                   imageSrc='${WebPost.Image}' 
                   waitingImage="Loading_icon.gif">
            </div>
            
            <label for="Creation" class="form-label">Date de création</label>
            <input 
                class="form-control"
                name="Creation"
                id="Creation"
                value="${new Date(WebPost.Creation).toLocaleString()}" 
                disabled
            />

            <br>
            <input type="submit" value="Enregistrer" id="saveWebPost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();

    $('#WebPostForm').on("submit", async function (event) {
        event.preventDefault();
        let WebPost = getFormData($("#WebPostForm"));
        WebPost.Creation = WebPost.Creation || Date.now();
        showWaitingGif();
        let result = await WebPosts_API.Save(WebPost, isCreate);
        if (result) {
            renderWebPosts();
        } else {
            renderError("Une erreur est survenue!");
        }
    });

    $('#cancel').on("click", function () {
        renderWebPosts();
    });
}

function renderWebPost(WebPost) {
    return $(`
     <div class="WebPostRow" WebPost_id=${WebPost.Id}">
        <div class="WebPostContainer noselect">
            <div class="WebPostLayout">
                <div class="WebPost">
                    <span class="WebPostCategory">${WebPost.Category}</span>
                    <span class="WebPostTitle">${WebPost.Title}</span>
                    <img class="WebPostImage" src="${WebPost.Image}" alt="${WebPost.Title}" />
                    <span class="WebPostCreationDate">
                        ${new Date(WebPost.Creation).toLocaleString('fr-FR', {
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: false
                        })}
                    </span>
                    <p class="WebPostText">${WebPost.Text}</p>
                </div>
            </div>
            <div class="WebPostCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editWebPostId="${WebPost.Id}" title="Modifier ${WebPost.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteWebPostId="${WebPost.Id}" title="Effacer ${WebPost.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}