document.addEventListener('DOMContentLoaded', function() {
    updateMenu();
    window.addEventListener('scroll', updateMenu);
});

function updateMenu() {
    // Compléter avec un code fonctionnel.

    // Attachez l'événement de défilement
    window.addEventListener('scroll', updateMenu);

    // Mettre à jour le menu à l'initialisation de la page
    updateMenu();