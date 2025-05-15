const PIXEL_URL = "http://127.0.0.1:8000"
const MAP_ID = "0000" 
let matrice = [];


function xy(ca) {
    i = ca.id
    return [parseInt(i.slice(0, 2)), parseInt(i.slice(2))]
}


function grDiv(i, j) {
    return document.getElementById(i + " " + j)
}

function couleurCss(triplet){
    return `rgb(${triplet[0]}, ${triplet[1]}, ${triplet[2]})`
}

document.addEventListener("DOMContentLoaded", async () => {

    const PREFIX = `${PIXEL_URL}/api/v1/${MAP_ID}`
    let isCooldown = false; 

    document.getElementById("baseurl").value = PIXEL_URL
    document.getElementById("mapid").value = MAP_ID
    document.getElementById("baseurl").readOnly = true
    document.getElementById("mapid").readOnly  = true

    // Demande une clé au backend
    fetch(`${PREFIX}/preinit`, {credentials: "include"})
        .then((response) => response.json())
        .then( async (json) => {
            const key = json.key;

            // Initialise l'utilisateur avec la clé
            const initResponse = await (await fetch(PREFIX + `/init?key=${key}`, {credentials: "include"})).json();
            const user_id = initResponse.id;
            const nx = initResponse.nx;
            const ny = initResponse.ny;
            matrice = initResponse.data;

            let selectCol = getPickedColorInRGB(); // Couleur choisie
            let gridHTML = document.getElementById("grid");

            // Construction de la grille HTML
            for(let y = 0; y<ny; y++){
                d = document.createElement("div")
                d.setAttribute("id", "l" + y)
                d.classList.add("ligne")
                gridHTML.appendChild(d)
                for(let x = 0; x<nx; x++){
                    s = document.createElement("div")
                    s.classList.add("case")
                    s.setAttribute("id", x + " " + y)
                    s.style.backgroundColor = couleurCss(matrice[y][x])
                    d.appendChild(s)
                }
            }

            // Bouton "refresh" (récupérer les nouveaux pixels)
            document.getElementById("refresh").addEventListener("click", async () => refresh(user_id))

            // Mise à jour de la couleur sélectionnée
            document.getElementById("colorpicker").addEventListener("change", () => {
                selectCol = getPickedColorInRGB();
            })

            // Gestion du clic sur un pixel
            gridHTML.addEventListener("click", async (event) => {
                if (isCooldown) return; // Bloqué si cooldown actif

                const coords = xy(event.target);
                const x = coords[0];
                const y = coords[1];

                const url = `${PREFIX}/set/${user_id}/${y}/${x}/${selectCol[0]}/${selectCol[1]}/${selectCol[2]}`;

                try {
                    let succes = await (await fetch(url, { credentials: "include" })).json();
                    if (succes === 0) {
                        // Mise à jour immédiate du pixel cliqué
                        event.target.style.backgroundColor = couleurCss(selectCol);

                        // Démarrage du cooldown avec compteur
                        isCooldown = true;
                        let temps = 9500;
                        let intervalle = setInterval(() => {
                            document.getElementById("compteur").textContent = temps / 1000;
                            if (temps <= 0) {
                                clearInterval(intervalle);
                                isCooldown = false;
                            }
                            temps -= 500;
                        }, 500);
                    }
                } catch (err) {
                    console.error("Erreur lors de la requête /set :", err);
                }
            })
        })

    // Met à jour la grille avec les modifications des autres
    async function refresh(user_id) {
        fetch(`${PREFIX}/deltas?id=${user_id}`, {credentials: "include"})
            .then((response) => response.json())
            .then((json) => {
                let deltas = json.deltas;
                for(const elt of deltas){
                    grDiv(elt[1], elt[0]).style.backgroundColor = couleurCss(elt.slice(2, 5))
                }
            })
    }

    // Récupère la couleur sélectionnée dans le color picker
    function getPickedColorInRGB() {
        const colorHexa = document.getElementById("colorpicker").value
        const r = parseInt(colorHexa.substring(1, 3), 16)
        const g = parseInt(colorHexa.substring(3, 5), 16)
        const b = parseInt(colorHexa.substring(5, 7), 16)
        return [r, g, b]
    }

    // Convertit une couleur CSS en hexadécimal pour le color picker
    function pickColorFrom(div) {
        const bg = window.getComputedStyle(div).backgroundColor
        const [r, g, b] = bg.match(/\d+/g)
        const rh = parseInt(r).toString(16).padStart(2, '0')
        const gh = parseInt(g).toString(16).padStart(2, '0')
        const bh = parseInt(b).toString(16).padStart(2, '0')
        const hex = `#${rh}${gh}${bh}`
        document.getElementById("colorpicker").value = hex
    }

})

