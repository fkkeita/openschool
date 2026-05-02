import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';

/**
 * Composant "Élèves"
 *
 * Objectif : reprendre l'intégralité du fichier eleves.html (version statique)
 * et l'encapsuler dans un composant Angular standalone, prêt à être affiché
 * via la route /students (clic sur l'entrée "Élèves" du sidebar).
 *
 * Philosophie : garder le fonctionnement existant (cycles, listes, modals,
 * filtres, ajout/édition/suppression) avec un code le plus didactique possible.
 * Chaque bloc de logique est accompagné de commentaires pour débutants.
 */
@Component({
    selector: 'app-students',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './students.component.html',
    styleUrl: './students.component.scss'
})
export class StudentsComponent implements OnInit {

    /** ------------ Modèles de données de base ------------ */
    // Modèle d'une année scolaire dans un cycle
    cycles: Cycle[] = [
        {
            nom: '1er CYCLE',
            description: '6 années - Cycle Fondamental (1ère à 6ème)',
            icon: 'book-open',
            annees: [
                { nom: '1ère Année', badge: 'Fondamental', nbClasses: 3, description: 'Première année du cycle fondamental. Initiation aux apprentissages de base.' },
                { nom: '2ème Année', badge: 'Fondamental', nbClasses: 3, description: 'Deuxième année : consolidation des acquis et découverte.' },
                { nom: '3ème Année', badge: 'Fondamental', nbClasses: 2, description: 'Troisième année : approfondissement des matières principales.' },
                { nom: '4ème Année', badge: 'Fondamental', nbClasses: 2, description: 'Quatrième année : introduction aux disciplines scientifiques.' },
                { nom: '5ème Année', badge: 'Fondamental', nbClasses: 3, description: 'Cinquième année : préparation à l\'entrée au collège.' },
                { nom: '6ème Année', badge: 'Fondamental', nbClasses: 3, description: 'Sixième année : fin du cycle fondamental, examen de passage.' }
            ]
        },
        {
            nom: '2ème CYCLE',
            description: '3 années - Cycle d\'orientation (7ème à 9ème)',
            icon: 'graduation-cap',
            annees: [
                { nom: '7ème Année', badge: 'Orientation', nbClasses: 3, description: 'Première année du cycle d\'orientation. Tronc commun.' },
                { nom: '8ème Année', badge: 'Orientation', nbClasses: 3, description: 'Deuxième année : début de l\'orientation progressive.' },
                { nom: '9ème Année', badge: 'Orientation', nbClasses: 3, description: 'Troisième année : préparation au lycée.' }
            ]
        },
        {
            nom: 'LYCÉE',
            description: '3 années - Lycée (10ème à 12ème)',
            icon: 'school',
            annees: [
                { nom: '10ème (Seconde)', badge: 'Lycée', nbClasses: 4, description: 'Première année du lycée, tronc commun et exploration.' },
                { nom: '11ème (Première)', badge: 'Lycée', nbClasses: 3, filieres: ['S', 'L', 'ES'], description: 'Spécialisation : séries Scientifique, Littéraire, Économique.' },
                { nom: '12ème (Terminale)', badge: 'Lycée', nbClasses: 3, filieres: ['S', 'L', 'ES'], description: 'Année du baccalauréat, préparation aux examens.' }
            ]
        }
    ];

    /** Liste des classes (ex: "1ère Année A", "10ème (Seconde) S"...) générées dynamiquement */
    classesListe: string[] = [];

    /** Map classe -> élèves (simulation locale pour la démo) */
    classesMap: Map<string, Eleve[]> = new Map();

    /** État d'ouverture des cycles (accueil) */
    cycleOuvert: Record<string, boolean> = {};

    /** Vue courante : accueil ou gestion */
    vue: 'accueil' | 'gestion' = 'accueil';

    /** Filtre d'année appliqué quand on clique sur "Gérer" */
    filtreAnneeCourante: string | null = null;

    /**
     * true = ajout lancé depuis l'accueil (toutes classes disponibles)
     * false = ajout lancé depuis la vue gestion (classes de l'année seulement)
     */
    ajoutGlobal = false;

    /** Classe sélectionnée dans le panneau de gauche (vue gestion) */
    classeActive: string | null = null;

    /** Recherches / filtres */
    rechercheAccueil = '';
    rechercheClasse = '';
    rechercheEleve = '';

    /** Données des modales */
    afficherModalEleve = false;
    afficherModalAnnee = false;
    afficherModalClasse = false;

    modalAnnee?: ModalAnnee;
    modalClasse?: ModalClasse;

    /** Cartes élèves ouvertes (accordéon) */
    elevesOuverts = new Set<number>();

    /** Gestion du formulaire multi-étapes */
    etapeCourante = 1;
    modeEdition = false;
    eleveEditeId: number | null = null;

    /** Données du formulaire d'élève (toutes les étapes) */
    formData: FormEleve = this.creerFormulaireVide();

    /** Listes de prénoms/ noms pour la génération aléatoire (identiques au HTML d'origine) */
    private prenoms = ['Mohamed', 'Amadou', 'Fatoumata', 'Mariam', 'Oumar', 'Kadiatou', 'Moussa', 'Aïssata', 'Mamadou', 'Aminata', 'Ibrahim', 'Djeneba', 'Souleymane', 'Bintou', 'Boubacar', 'Rokia', 'Adama', 'Hawa', 'Drissa', 'Ismael'];
    private noms = ['Traoré', 'Diarra', 'Touré', 'Coulibaly', 'Konaté', 'Diallo', 'Keita', 'Camara', 'Doumbia', 'Diakité', 'Sissoko', 'Sow', 'Bah', 'Barry', 'Cissé', 'Dembélé', 'Fofana', 'Kone', 'Sangaré', 'Togola'];

    /** ------------ Cycle de vie ------------ */
    ngOnInit(): void {
        // 1) Génère la liste des classes et remplit la map élèves
        this.classesListe = this.genererListeClasses();
        this.initialiserElevesParClasse();

        // 2) Ouvre par défaut le premier cycle pour un accueil visuel agréable
        this.cycles.forEach((cycle, idx) => this.cycleOuvert[cycle.nom] = idx === 0);
    }

    /** ------------ Génération / simulation de données ------------ */

    /**
     * Génère toutes les classes à partir des cycles/années
     * (exactement comme dans eleves.html)
     */
    genererListeClasses(): string[] {
        const classes: string[] = [];
        this.cycles.forEach(cycle => {
            cycle.annees.forEach(annee => {
                if (cycle.nom === 'LYCÉE' && annee.filieres) {
                    // Pour le lycée : 10ème S/L/ES, etc.
                    annee.filieres.forEach(filiere => {
                        classes.push(`${annee.nom.split(' ')[0]} ${filiere}`);
                    });
                } else {
                    // Pour les autres : 1ère Année A, 1ère Année B...
                    for (let i = 0; i < annee.nbClasses; i++) {
                        const lettre = String.fromCharCode(65 + i);
                        classes.push(`${annee.nom} ${lettre}`);
                    }
                }
            });
        });
        return classes;
    }

    /**
     * Détermine l'effectif "de base" d'une classe (logique identique au fichier HTML)
     */
    private calculerEffectifInitial(classe: string): number {
        if (classe.includes('10ème')) return 13;
        if (classe.includes('11ème') || classe.includes('12ème')) return 16;
        if (classe.includes('3ème') || classe.includes('4ème')) return 19;
        if (classe.includes('5ème') || classe.includes('6ème')) return 16;
        if (classe.includes('7ème') || classe.includes('8ème') || classe.includes('9ème')) return 18;
        return 15;
    }

    /**
     * Génère des élèves aléatoires pour une classe
     */
    private genererEleves(classe: string, nb: number): Eleve[] {
        const eleves: Eleve[] = [];
        for (let i = 0; i < nb; i++) {
            const prenom = this.choisirAleatoire(this.prenoms);
            const nom = this.choisirAleatoire(this.noms);
            const presence = Math.random() > 0.2 ? 'Présent' : 'Absent';
            eleves.push({
                id: Date.now() + i + Math.random(),
                prenom,
                nom,
                fullName: `${prenom} ${nom}`,
                notes: { maths: '00.0', francais: '00.0', anglais: '00.0' },
                presence,
                email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@ecole.ml`,
                telephone: `+223 ${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
                parent: `${this.choisirAleatoire(this.noms)} ${prenom === 'Mohamed' ? 'Moussa' : 'Fatoumata'}`
            });
        }
        return eleves;
    }

    /**
     * Initialise la map classe -> élèves (données locales)
     */
    private initialiserElevesParClasse(): void {
        this.classesListe.forEach(classe => {
            const effectif = this.calculerEffectifInitial(classe);
            this.classesMap.set(classe, this.genererEleves(classe, effectif));
        });
    }

    /** ------------ Aide utilitaire ------------ */
    private choisirAleatoire<T>(liste: T[]): T {
        return liste[Math.floor(Math.random() * liste.length)];
    }

    /**
     * Récupère toutes les classes liées à une année donnée (utile pour modals/gestion)
     */
    recupererClassesParAnnee(anneeNom: string): string[] {
        const classes: string[] = [];
        this.cycles.forEach(cycle => {
            cycle.annees.forEach(annee => {
                if (annee.nom === anneeNom) {
                    if (cycle.nom === 'LYCÉE' && annee.filieres) {
                        annee.filieres.forEach(filiere => {
                            classes.push(`${annee.nom.split(' ')[0]} ${filiere}`);
                        });
                    } else {
                        for (let i = 0; i < annee.nbClasses; i++) {
                            const lettre = String.fromCharCode(65 + i);
                            classes.push(`${annee.nom} ${lettre}`);
                        }
                    }
                }
            });
        });
        return classes;
    }

    /**
     * Calcule rapidement les stats d'une année (total élèves, présence moyenne)
     */
    calculerStatsAnnee(anneeNom: string): { totalEleves: number; presence: string; nbClasses: number; } {
        const classes = this.recupererClassesParAnnee(anneeNom);
        let total = 0;
        let presents = 0;
        classes.forEach(c => {
            const eleves = this.classesMap.get(c) || [];
            total += eleves.length;
            presents += eleves.filter(e => e.presence === 'Présent').length;
        });
        const presence = total > 0 ? `${Math.round((presents / total) * 100)}%` : '0%';
        return { totalEleves: total, presence, nbClasses: classes.length };
    }

    /** ------------ Gestion vue "accueil" ------------ */

    /**
     * Filtre les années visibles selon la recherche globale
     */
    anneesVisibles(cycle: Cycle): Annee[] {
        if (!this.rechercheAccueil) return cycle.annees;
        const terme = this.rechercheAccueil.toLowerCase();
        return cycle.annees.filter(annee =>
            annee.nom.toLowerCase().includes(terme) ||
            annee.description.toLowerCase().includes(terme)
        );
    }

    /**
     * Toggle d'un cycle (ouvre/ferme la section)
     */
    basculerCycle(cycleNom: string): void {
        const dejaOuvert = this.cycleOuvert[cycleNom];
        // On ferme les autres pour garder un comportement accordéon lisible
        this.cycles.forEach(c => this.cycleOuvert[c.nom] = false);
        this.cycleOuvert[cycleNom] = !dejaOuvert;
    }

    /**
     * Lorsque l'utilisateur tape dans la recherche générale :
     * - on force l'ouverture de tous les cycles pour voir les résultats
     * - sinon on remet seulement le premier ouvert (comme la page initiale)
     */
    onRechercheAccueilChange(valeur: string): void {
        this.rechercheAccueil = valeur;
        if (valeur) {
            this.cycles.forEach(c => this.cycleOuvert[c.nom] = true);
        } else {
            this.cycles.forEach((c, idx) => this.cycleOuvert[c.nom] = idx === 0);
        }
    }

    /**
     * Bouton "Gérer" : ouvre la vue gestion filtrée sur une année
     */
    ouvrirGestion(anneeNom: string): void {
        this.vue = 'gestion';
        this.filtreAnneeCourante = anneeNom;
        this.classeActive = null;
        this.rechercheClasse = '';
        this.rechercheEleve = '';
    }

    /**
     * Classes disponibles dans le formulaire d'ajout/édition.
     * - Mode global (depuis accueil) : toutes les classes
     * - Mode contextuel (depuis Gérer d'une année) : uniquement les classes de cette année
     */
    get classesDisponiblesForm(): string[] {
        if (this.ajoutGlobal || !this.filtreAnneeCourante) {
            return this.classesListe; // toutes les classes
        }
        return this.recupererClassesParAnnee(this.filtreAnneeCourante);
    }

    /**
     * Bouton "Voir les élèves" : ouvre la modale de liste par année
     */
    ouvrirModalAnnee(anneeNom: string): void {
        const classes = this.recupererClassesParAnnee(anneeNom).map(classe => ({
            nom: classe,
            eleves: this.classesMap.get(classe) || []
        }));
        this.modalAnnee = { annee: anneeNom, classes };
        this.afficherModalAnnee = true;
    }

    /**
     * Clic sur une classe dans le dropdown : modale dédiée
     */
    ouvrirModalClasse(classe: string): void {
        this.modalClasse = {
            classe,
            eleves: this.classesMap.get(classe) || []
        };
        this.afficherModalClasse = true;
    }

    /** ------------ Gestion vue "gestion détaillée" ------------ */

    /**
     * Liste des classes filtrées (champ recherche + filtre année si présent)
     */
    get classesFiltrees(): string[] {
        let base = [...this.classesListe];
        // Filtre exact sur l'année (ex: "2ème Année" → "2ème Année A", "2ème Année B"...)
        if (this.filtreAnneeCourante) {
            const classesAnnee = this.recupererClassesParAnnee(this.filtreAnneeCourante);
            base = base.filter(c => classesAnnee.includes(c));
        }
        if (this.rechercheClasse) {
            const terme = this.rechercheClasse.toLowerCase();
            base = base.filter(c => c.toLowerCase().includes(terme));
        }
        return base;
    }

    /**
     * Sélection d'une classe : met à jour la colonne des élèves
     */
    selectionnerClasse(classe: string): void {
        this.classeActive = classe;
    }

    /**
     * Liste des élèves filtrés (par recherche prénom/nom)
     */
    get elevesFiltres(): Eleve[] {
        if (!this.classeActive) return [];
        const eleves = this.classesMap.get(this.classeActive) || [];
        if (!this.rechercheEleve) return eleves;
        const terme = this.rechercheEleve.toLowerCase();
        return eleves.filter(e => e.fullName.toLowerCase().includes(terme));
    }

    /** ------------ Gestion modale d'ajout/édition ------------ */

    /**
     * Prépare un formulaire vide pour un nouvel élève
     */
    private creerFormulaireVide(): FormEleve {
        return {
            prenom: '',
            nom: '',
            dateNaiss: '',
            lieuNaiss: '',
            sexe: 'M',
            nationalite: 'Malienne',
            tuteurNom: '',
            tuteurPrenom: '',
            tuteurTel: '',
            tuteurEmail: '',
            tuteurAdresse: '',
            classe: '',
            dateInscription: '',
            matricule: 'AUTO' + Math.floor(Math.random() * 10000),
            fraisInscription: 250,
            mensualite: 120,
            modePaiement: 'especes',
            echeances: '',
            totalAnnuel: '',
            resteAPayer: '0 €',
            statutPaiement: 'À jour'
        };
    }

    /**
     * Ouvre la modale en mode "ajout"
     */
    /**
     * @param global true = depuis le bouton de l'accueil (toutes classes)
     *               false (défaut) = depuis la vue gestion (classes de l'année)
     */
    ouvrirModalAjout(global = false): void {
        // En mode contextuel, une classe doit être sélectionnée
        if (!global && !this.classeActive) {
            alert('Sélectionnez d\'abord une classe à gauche.');
            return;
        }
        this.ajoutGlobal = global;
        this.modeEdition = false;
        this.eleveEditeId = null;
        this.formData = this.creerFormulaireVide();
        // Pré-sélectionne la classe active si on est en mode contextuel
        if (!global && this.classeActive) {
            this.formData.classe = this.classeActive;
        }
        this.etapeCourante = 1;
        this.afficherModalEleve = true;
    }

    /**
     * Ouvre la modale en mode "édition" d'un élève existant
     */
    ouvrirModalEdition(eleve: Eleve, classe: string): void {
        this.modeEdition = true;
        this.eleveEditeId = eleve.id;
        this.formData = {
            ...this.creerFormulaireVide(),
            prenom: eleve.prenom,
            nom: eleve.nom,
            tuteurPrenom: eleve.parent.split(' ')[0] || '',
            tuteurNom: eleve.parent.split(' ')[1] || '',
            tuteurTel: eleve.telephone,
            tuteurEmail: eleve.email,
            classe,
        };
        this.etapeCourante = 1;
        this.afficherModalEleve = true;
    }

    /**
     * Passage d'une étape à l'autre (timeline)
     */
    allerEtape(etape: number): void {
        this.etapeCourante = etape;
        if (etape === 5) {
            // Calcul du total annuel (frais + 12 mensualités)
            const frais = Number(this.formData.fraisInscription) || 0;
            const mens = Number(this.formData.mensualite) || 0;
            this.formData.totalAnnuel = (frais + mens * 12).toFixed(2) + ' €';
        }
    }

    /**
     * Valide et enregistre l'élève (ajout ou édition)
     */
    enregistrerEleve(): void {
        if (!this.formData.prenom || !this.formData.nom || !this.formData.classe) {
            alert('Prénom, Nom et Classe sont obligatoires.');
            return;
        }

        const nouvelEleve: Eleve = {
            id: this.modeEdition && this.eleveEditeId ? this.eleveEditeId : Date.now(),
            prenom: this.formData.prenom,
            nom: this.formData.nom,
            fullName: `${this.formData.prenom} ${this.formData.nom}`,
            notes: { maths: '00.0', francais: '00.0', anglais: '00.0' },
            presence: 'Présent',
            email: this.formData.tuteurEmail || `${this.formData.prenom.toLowerCase()}.${this.formData.nom.toLowerCase()}@ecole.ml`,
            telephone: this.formData.tuteurTel || '+223 00000000',
            parent: `${this.formData.tuteurPrenom} ${this.formData.tuteurNom}`.trim() || 'Parent'
        };

        const classeCible = this.formData.classe;

        // Retire l'élève de son ancienne classe en cas d'édition et de changement
        if (this.modeEdition && this.eleveEditeId) {
            for (const [classe, eleves] of this.classesMap.entries()) {
                const avant = eleves.length;
                this.classesMap.set(classe, eleves.filter(e => e.id !== this.eleveEditeId));
                const apres = this.classesMap.get(classe)!.length;
                if (avant !== apres && this.classeActive === classe) {
                    // refresh si c'était la classe affichée
                    this.classeActive = classeCible;
                }
            }
        }

        // Ajoute dans la classe cible
        const cible = this.classesMap.get(classeCible) || [];
        cible.push(nouvelEleve);
        this.classesMap.set(classeCible, cible);

        // Si on est sur cette classe, rafraîchir l'affichage
        if (this.classeActive === classeCible) {
            this.classeActive = classeCible; // déclenche les getters
        }

        this.afficherModalEleve = false;
    }

    /**
     * Suppression d'un élève
     */
    supprimerEleve(id: number): void {
        if (!this.classeActive) return;
        const confirmation = confirm('Supprimer cet élève ?');
        if (!confirmation) return;
        const liste = this.classesMap.get(this.classeActive) || [];
        this.classesMap.set(this.classeActive, liste.filter(e => e.id !== id));
        this.elevesOuverts.delete(id);
    }

    /**
     * Affiche les notes d'un élève (comme dans le HTML original)
     */
    voirNotes(eleve: Eleve): void {
        alert(`Notes de ${eleve.prenom} ${eleve.nom}\nMaths: ${eleve.notes.maths}\nFrançais: ${eleve.notes.francais}\nAnglais: ${eleve.notes.anglais}`);
    }

    /** ------------ Navigation globale ------------ */
    revenirAccueil(): void {
        this.vue = 'accueil';
        this.filtreAnneeCourante = null;
        this.classeActive = null;
    }

    /**
     * Message placeholder pour le bouton "Filtre avancé"
     */
    infoFiltreAvance(): void {
        alert('Fonctionnalité de filtre avancé - à implémenter avec un backend.');
    }

    /** ------------ Modales impression / fermeture ------------ */

    imprimer(): void {
        window.print();
    }

    fermerToutesModales(): void {
        this.afficherModalAnnee = false;
        this.afficherModalClasse = false;
    }

    /** ------------ Helpers de template ------------ */

    /**
     * Raccourcis pour afficher l'effectif d'une classe dans la liste gauche
     */
    effectifClasse(classe: string): number {
        return (this.classesMap.get(classe) || []).length;
    }

    /**
     * Permet de savoir si une carte d'élève doit être affichée "dépliée"
     * (Ici on laisse la logique au template via un booléen local)
     */
    trackByEleveId(_: number, eleve: Eleve): number {
        return eleve.id;
    }

    /**
     * Gestion de l'état "déplié" d'une carte élève
     */
    estEleveOuvert(id: number): boolean {
        return this.elevesOuverts.has(id);
    }

    basculerEleve(id: number): void {
        if (this.elevesOuverts.has(id)) {
            this.elevesOuverts.delete(id);
        } else {
            this.elevesOuverts.add(id);
        }
    }
}

/** ------------ Types utilisés par le composant ------------ */

interface Cycle {
    nom: string;
    description: string;
    icon: string;
    annees: Annee[];
}

interface Annee {
    nom: string;
    badge: string;
    nbClasses: number;
    description: string;
    filieres?: string[];
}

interface Eleve {
    id: number;
    prenom: string;
    nom: string;
    fullName: string;
    notes: { maths: string; francais: string; anglais: string; };
    presence: 'Présent' | 'Absent';
    email: string;
    telephone: string;
    parent: string;
}

interface FormEleve {
    prenom: string;
    nom: string;
    dateNaiss: string;
    lieuNaiss: string;
    sexe: 'M' | 'F';
    nationalite: string;
    tuteurNom: string;
    tuteurPrenom: string;
    tuteurTel: string;
    tuteurEmail: string;
    tuteurAdresse: string;
    classe: string;
    dateInscription: string;
    matricule: string;
    fraisInscription: number;
    mensualite: number;
    modePaiement: string;
    echeances: string;
    totalAnnuel: string;
    resteAPayer: string;
    statutPaiement: string;
}

interface ModalAnnee {
    annee: string;
    classes: { nom: string; eleves: Eleve[]; }[];
}

interface ModalClasse {
    classe: string;
    eleves: Eleve[];
}
