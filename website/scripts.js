document.addEventListener('DOMContentLoaded', function() {
    // Attachez l'événement de défilement pour mettre à jour le menu
    window.addEventListener('scroll', updateMenu);

    // Attachez un écouteur d'événements à tous vos liens de navigation pour le défilement fluide
    document.querySelectorAll('#fixedMenu a').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault(); // Empêche le comportement par défaut du lien
            // Utilise l'attribut href du lien pour trouver l'élément cible
            var targetID = this.getAttribute('href');
            var targetSection = document.querySelector(targetID);
            // Si la section cible existe, faites défiler vers elle
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    updateMenu();
});

function updateMenu() {
    var sections = document.querySelectorAll('main .slide');
    var menuLinks = document.querySelectorAll('#fixedMenu a');
    var scrollPosition = window.scrollY || document.documentElement.scrollTop;

    sections.forEach((section, index) => {
        // Calculer où la section se situe dans la page
        if (section.offsetTop <= scrollPosition && section.offsetTop + section.offsetHeight > scrollPosition) {
            // Retirer la classe 'active' de tous les liens
            menuLinks.forEach(link => {
                link.classList.remove('active');
            });
            // Ajouter la classe 'active' au lien qui correspond à la section
            menuLinks[index].classList.add('active');
        }
    });
}
