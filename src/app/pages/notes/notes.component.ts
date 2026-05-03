import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { SchoolDataService, Cycle, Annee } from '../../core/services/school-data.service';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - Définitions des types de données utilisés dans le composant
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Représente un élève dans le système de notation.
 * Ces données proviennent du composant Élèves via le service partagé.
 */
interface Eleve {
    id: number;
    prenom: string;
    nom: string;
    classe: string;
}

/**
 * Représente une note pour un devoir ou une interrogation.
 * Cette note est simple - une seule valeur par élève.
 */
interface NoteEntry {
    id: number;
    eleveId: number;
    matiere: string;
    type: 'devoir' | 'interrogation' | 'trimestre' | 'composition' | 'examen';
    titre: string;
    note: number;
    coefficient?: number;
    date: string;
}

/**
 * Représente un événement collectif (Trimestre, Composition, Examen).
 * Contrairement au devoir simple, un trimestre évalue plusieurs matières.
 * 
 * NOUVEAU FONCTIONNEMENT (depuis la refactorisation):
 * - Les matières sont cochées lors de la création
 * - Les statistiques (moyenne, coef, etc.) sont saisies PAR ÉLÈVE
 *   lors de l'attribution des notes, pas lors de la création
 */
interface EvenementCollectif {
    id: number;              // ID unique généré automatiquement
    classe: string;          // Classe concernée (ex: "1ère Année A")
    type: 'trimestre' | 'composition' | 'examen';  // Type d'évaluation
    titre: string;           // Nom (ex: "1er Trimestre")
    date: string;           // Date de l'évaluation
    matieres: string[];      // Matières COCHÉES lors de la création
    // Note: les moyennes/coefficients/appréciations sont stockés
    // dans les notes de chaque élève, pas ici
}

/**
 * Données d'une note de trimestre pour un élève spécifique.
 * Contient tous les détails par matière pour cet élève.
 */
interface NoteTrimestre {
    id: number;                  // ID unique
    eleveId: number;           // Référence vers l'élève
    trimestreId: number;      // Référence vers l'événement collectif
    matiere: string;          // Matière évaluée
    moyenneClasse: number;    // Moyenne de la CLASSE pour cette matière (/20)
    noteCompo: number;        // Note de composition (/40) - note brute de l'élève
    moyenne: number;          // Moyenne ramenée sur 20
    coefficient: number;      // Coefficient de la matière
    moyenneCoefficientee: number;  // Note coefficiée (moyenne × coef)
    appreciation: string;    // Appréciation (ex: "Assez-Bien", "Bien", etc.)
    date: string;            // Date de saisie
}

/**
 * Représente un formulaire de création de devoir/interrogation.
 * Simple et rapide - une seule matière à la fois.
 */
interface FormDevoir {
    titre: string;         // Nom du devoir
    type: 'devoir' | 'interrogation';
    matiere: string;      // Matière évaluée
    date: string;       // Date du devoir
}

/**
 * Représente un formulaire de création de trimestre.
 * NOUVEAU: oncoche seulement les matières, pas de statistiques!
 */
interface FormTrimestre {
    titre: string;              // Nom du trimestre (ex: "1er Trimestre")
    type: 'trimestre' | 'composition' | 'examen';
    date: string;             // Date de l'évaluation
    matieres: string[];        // Matières COCHÉES (pas de valeurs!)
}

/**
 * Représente le formulaire de saisie des notes d'un élève pour un trimestre.
 * Une ligne par matière cochée lors de la création du trimestre.
 */
interface LigneAttributionTrimestre {
    matiere: string;              // Nom de la matière
    moyenneClasse: number;       // Moyenne de la classe (/20)
    noteCompo: number;         // Note de composition (/40)
    moyenne: number;          // Moyenne (/20)
    coefficient: number;     // Coefficient
    moyenneCoefficientee: number;  // Note coefficiée
    appreciation: string;      // Appréciation
}

/**
 * État du popup d'attribution des notes de trimestre.
 * Garde trace de où on en est dans le processus.
 */
interface AttributionTrimestreState {
    opened: boolean;        // Est-ce que le popup est ouvert?
    trimestreId: number;   // ID du trimestre concerné
    eleveIndex: number;    // Index de l'élève en cours de saisie
    eleves: Eleve[];       // Liste des élèves à saisir
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

@Component({
    selector: 'app-notes',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './notes.component.html',
    styleUrl: './notes.component.scss'
})
export class NotesComponent implements OnInit {

    // ─────────────────────────────────────────────────────────────────────────────
    // INJECTION DU SERVICE Partagé
    // ─────────────────────────────────────────────────────────────────────────────

    /** 
     * Injection du service SchoolDataService qui contient les données communes
     * (cycles, années, classes, matières, enseignants).
     * Ce service保证了 la cohérence entre tous les composants.
     */
    private schoolData = inject(SchoolDataService);

    // ═══════════════════════════════════════════════════════════════════════════════
    // PROPRIÉTÉS PUBLIQUES (État du Composant)
    // ═══════════════════════════════════════════════════════════════════════════════

    // ── Navigation accueil ────────────────────────────────────────────────────
    public rechercheAccueil = '';  // Barre de recherche
    public cycleOuvert: Record<string, boolean> = {};  // cycles ouverts/fermés

    // ── Mode d'affichage ────────────────────────────���─────────────────────────
    public mode: 'home' | 'gerer' | 'voir' | 'gerer-picker' = 'home';
    public selectedAnnee: Annee | null = null;
    public selectedClasse: string | null = null;

    // ── Popups ────────────────────────────────────────────────────────────────
    public showVoirModal = false;
    public voirAnnee: Annee | null = null;
    public showElevesModal: Eleve[] | null = null;
    public selectedEleve: Eleve | null = null;
    public showGererClasseModal: string | null = null;
    public showCreateDevoirModal = false;
    public showCreateEvenementModal = false;
    public showAttribuerNotesModal: { type: string; titre: string; evenementId?: number } | null = null;

    // NOUVEAUX POPUPS pour le trimestre
    public showAttribuerTrimestreModal = false;

    // ── Données (Simulées - à remplacer par données réelles du backend) ──────────
    public elevesParClasse: Map<string, Eleve[]> = new Map();
    public notesStore: Map<number, NoteEntry[]> = new Map();
    public notesTrimestreStore: Map<number, NoteTrimestre[]> = new Map();
    public evenements: EvenementCollectif[] = [];

    // ── Formulaires ────────────────────────────────────────────────────────
    public formDevoir: FormDevoir = this.creerFormDevoirVide();
    public formTrimestre: FormTrimestre = this.creerFormTrimestreVide();
    public formAttribuer: { eleveId: number; note: number }[] = [];

    // NOUVEAU: formulaire pour les notes de trimestre (par élève)
    public formAttribuerTrimestre: LigneAttributionTrimestre[] = [];

    // ═══════════════════════════════════════════════════════════════════════════════
    // ACCESSEURS (Getters - Propriétés calculées)
    // ═══════════════════════════════════════════════════════════════════════════════

    /** Retourne la liste des cycles pour l'affichage */
    get cycles(): Cycle[] {
        return this.schoolData.cycles;
    }

    /** 
     * Retourne la liste de TOUTES les classes du système.
     * Utilise le service partagé pour la cohérence.
     */
    get classesListe(): string[] {
        return this.schoolData.toutesLesClasses();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // MÉTHODES D'INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════════════

    ngOnInit(): void {
        // Ouvrir le premier cycle par défaut
        this.cycles.forEach((c, i) => this.cycleOuvert[c.nom] = i === 0);

        // Générer des élèves simulés pour la démo
        // NOTE: Dans une vraie application, ces données viendraient du backend
        this.genererElevesSimules();
    }

    /**
     * Génère des élèves simulés pour chaque classe.
     * NOTE: Ce code devrait être remplacé par un appel API vers le backend.
     */
    private genererElevesSimules(): void {
        this.classesListe.forEach(classe => {
            // Générer entre 15 et 25 élèves par classe
            const effectif = Math.floor(Math.random() * 10) + 15;
            const eleves: Eleve[] = [];

            for (let i = 1; i <= effectif; i++) {
                const id = Date.now() + i;
                eleves.push({
                    id,
                    prenom: `Élève${i}`,
                    nom: classe.replace(' ', '_'),
                    classe
                });
                // Initialiser une liste vide de notes pour chaque élève
                this.notesStore.set(id, []);
                this.notesTrimestreStore.set(id, []);
            }

            this.elevesParClasse.set(classe, eleves);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // MÉTHODES UTILITAIRES (Helpers)
    // ═══════════════════════════════════════════════════════════════════════════════

    /** 
     * Crée un formulaire de devoir vide.
     * @returns Un objet FormDevoir avec les valeurs par défaut.
     */
    private creerFormDevoirVide(): FormDevoir {
        return {
            titre: '',
            type: 'devoir',
            matiere: '',
            date: new Date().toISOString().split('T')[0]
        };
    }

    /**
     * Crée un formulaire de trimestre vide.
     * @returns Un objet FormTrimestre avec les valeurs par défaut.
     */
    private creerFormTrimestreVide(): FormTrimestre {
        return {
            titre: '',
            type: 'trimestre',
            date: new Date().toISOString().split('T')[0],
            matieres: []
        };
    }

    /**
     * Bascule l'état ouvert/fermé d'un cycle (accordeon).
     */
    basculerCycle(nom: string): void {
        this.cycleOuvert[nom] = !this.cycleOuvert[nom];
    }

    /**
     * Filtre les années visibles selon la recherche.
     */
    anneesVisibles(cycle: Cycle): Annee[] {
        if (!this.rechercheAccueil) return cycle.annees;
        const t = this.rechercheAccueil.toLowerCase();
        return cycle.annees.filter(a =>
            a.nom.toLowerCase().includes(t) || a.description.toLowerCase().includes(t));
    }

    /**
     * Calcule les statistiques d'une année.
     */
    statsPourAnnee(anneeNom: string): any {
        const classes = this.schoolData.classesPourAnnee(anneeNom);
        return {
            nbClasses: classes.length,
            nbEleves: classes.reduce((sum, c) => sum + (this.elevesParClasse.get(c)?.length || 0), 0),
            classes
        };
    }

    /**
     * Retourne les classes d'une année spécifique.
     */
    getClassesAnnee(annee: Annee | null): string[] {
        if (!annee) return [];
        return this.schoolData.classesPourAnnee(annee.nom);
    }

    /**
     * Retourne les matières d'une classe via le service partagé.
     * IMPORTANT: Cela garantit la cohérence avec les autres composants.
     */
    getMatieresClasse(classe: string): string[] {
        if (!classe) return [];
        return this.schoolData.matieresPourClasse(classe).map(m => m.matiere);
    }

    /**
     * Retourne le nom complet d'un élève à partir de son ID.
     */
    getEleveName(id: number): string {
        for (const eleves of this.elevesParClasse.values()) {
            const found = eleves.find(e => e.id === id);
            if (found) return `${found.prenom} ${found.nom}`;
        }
        return '';
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FONCTIONS "VOIR LES NOTES"
    // ═══════════════════════════════════════════════════════════════════════════════════════

    /** Ouvre le popup de sélection d'année */
    ouvrirVoir(annee: Annee): void {
        this.voirAnnee = annee;
        this.showVoirModal = true;
    }

    /** Sélectionne une classe et affiche les élèves */
    selectClasseVoir(classe: string): void {
        this.showVoirModal = false;
        this.selectedClasse = classe;
        const eleves = this.elevesParClasse.get(classe) || [];
        this.showElevesModal = eleves;
    }

    /** Ferme le popup des élèves */
    fermerElevesModal(): void {
        this.showElevesModal = null;
        this.selectedClasse = null;
    }

    /** Sélectionne un élève pour voir ses notes */
    selectEleve(eleve: Eleve): void {
        this.selectedEleve = eleve;
        this.showElevesModal = null;
    }

    /** Ferme le popup des notes d'un élève */
    fermerNotesEleve(): void {
        this.selectedEleve = null;
    }

    /** Retourne les notes d'un élève */
    getNotesEleve(eleveId: number): NoteEntry[] {
        return this.notesStore.get(eleveId) || [];
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FONCTIONS "GÉRER"
    // ═══════════════════════════════════════════════════════════════════════════════

    /** Ouvre le picker de sélection d'année pour gérer */
    ouvrirGerer(annee: Annee): void {
        this.selectedAnnee = annee;
        this.mode = 'gerer-picker';
    }

    /** Sélectionne une classe pour gérer */
    selectClasseGerer(classe: string): void {
        this.selectedClasse = classe;
        this.showGererClasseModal = classe;
    }

    /** Ferme le popup de gestion de classe */
    fermerGererClasseModal(): void {
        this.showGererClasseModal = null;
        this.selectedClasse = null;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CRÉATION DEVOIR / INTERROGATION
    // ═══════════════════════════════════════════════════════════════════════════════

    /** Ouvre le popup de création de devoir */
    ouvrirCreationDevoir(): void {
        this.formDevoir = this.creerFormDevoirVide();
        this.showCreateDevoirModal = true;
    }

    /**
     * Crée un devoir et ouvre le popup d'attribution des notes.
     */
    creerDevoir(): void {
        if (!this.formDevoir.titre || !this.formDevoir.matiere) return;
        this.showCreateDevoirModal = false;
        this.ouvrirAttribuerNotes(this.formDevoir.type, this.formDevoir.titre);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CRÉATION TRIMESTRE / COMPOSITION / EXAMEN
    // ═══════════════════════════════════════════════════════════════════════════════

    /** Ouvre le popup de création de trimestre */
    ouvrirCreationEvenement(): void {
        this.formTrimestre = this.creerFormTrimestreVide();
        this.showCreateEvenementModal = true;
    }

    /**
     * Bascule la sélection d'une matière dans le formulaire.
     * @param matiere Nom de la matière à cocher/décocher
     */
    toggleMatiereTrimestre(matiere: string): void {
        const index = this.formTrimestre.matieres.indexOf(matiere);
        if (index === -1) {
            this.formTrimestre.matieres.push(matiere);
        } else {
            this.formTrimestre.matieres.splice(index, 1);
        }
    }

    /**
     * Vérifie si une matière est cochée.
     * @param matiere Nom de la matière à vérifier
     */
    isMatiereSelected(matiere: string): boolean {
        return this.formTrimestre.matieres.includes(matiere);
    }

    /**
     * Enregistre le trimestre et ouvre l'attribution des notes.
     * NOUVEAU: On ne demande QUE les matières cochées!
     */
    enregistrerEvenement(): void {
        if (!this.formTrimestre.titre || !this.selectedClasse || this.formTrimestre.matieres.length === 0) return;

        const evenement: EvenementCollectif = {
            id: Date.now(),
            classe: this.selectedClasse,
            type: this.formTrimestre.type,
            titre: this.formTrimestre.titre,
            date: this.formTrimestre.date,
            matieres: [...this.formTrimestre.matieres]  // Copie des matières cochées
        };

        this.evenements.push(evenement);
        this.showCreateEvenementModal = false;

        // Ouvrir le popup d'attribution des notes de trimestre
        this.ouvrirAttribuerTrimestre(evenement);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ATTRIBUTION DES NOTES (Devoir simple)
    // ═══════════════════════════════════════════════════════════════════════════════

    /** Ouvre le popup d'attribution des notes pour un devoir */
    ouvrirAttribuerNotes(type: string, titre: string, evenementId?: number): void {
        this.showAttribuerNotesModal = { type, titre, evenementId };
        const eleves = this.elevesParClasse.get(this.selectedClasse!) || [];
        this.formAttribuer = eleves.map(e => ({ eleveId: e.id, note: 0 }));
    }

    /**
     * Enregistre les notes d'un devoir simple.
     * NOTE: Une seule matière, une seule note par élève.
     */
    enregistrerAttribution(): void {
        if (!this.showAttribuerNotesModal) return;
        const { type, titre } = this.showAttribuerNotesModal;
        const matiere = this.formDevoir.matiere;

        this.formAttribuer.forEach(att => {
            if (att.note < 0) return;
            const note: NoteEntry = {
                id: Date.now() + Math.random(),
                eleveId: att.eleveId,
                matiere: matiere || '',
                type: type as NoteEntry['type'],
                titre,
                note: att.note,
                date: new Date().toISOString().split('T')[0],
            };
            const notesEleve = this.notesStore.get(att.eleveId) || [];
            notesEleve.push(note);
            this.notesStore.set(att.eleveId, notesEleve);
        });
        this.showAttribuerNotesModal = null;
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════
    // ATTRIBUTION DES NOTES DE TRIMESTRE (NOUVEAU!)
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Ouvre le popup d'attribution des notes de trimestre.
     * On affiche les élèves UN PAR UN pour saisie individuelle.
     * 
     * @param evenement Le trimestre nouvellement créé
     */
    ouvrirAttribuerTrimestre(evenement: EvenementCollectif): void {
        if (!this.selectedClasse) return;

        const eleves = this.elevesParClasse.get(this.selectedClasse) || [];

        if (eleves.length === 0) return;

        // Initialiser les données du popup
        this.currentTrimestreState = {
            opened: true,
            trimestreId: evenement.id,
            eleveIndex: 0,
            eleves: eleves
        };

        // Préparer le formulaire pour le premier élève
        this.preparerFormulaireTrimestre(evenement);

        this.showAttribuerTrimestreModal = true;
    }

    /** Données pour le popup d'attribution des notes de trimestre */
    currentTrimestreState: AttributionTrimestreState | null = null;

    /**
     * Prépare le formulaire de saisie des notes pour un élève.
     * Crée une ligne par matière cochée lors de la création du trimestre.
     * 
     * @param evenement Le trimestre concerné
     */
    private preparerFormulaireTrimestre(evenement: EvenementCollectif): void {
        // Créer une ligne par matière
        this.formAttribuerTrimestre = evenement.matieres.map(matiere => ({
            matiere: matiere,
            moyenneClasse: 0,
            noteCompo: 0,
            moyenne: 0,
            coefficient: 1,
            moyenneCoefficientee: 0,
            appreciation: ''
        }));
    }

    /**
     * Passe à l'élève suivant dans la saisie.
     * Si on a fini, enregistre et ferme le popup.
     */
    siguienteEleveTrimestre(): void {
        if (!this.currentTrimestreState) return;

        // Enregistrer les notes de l'élève actuel
        this.enregistrerNotesTrimestreEleve();

        // Passer à l'élève suivant
        this.currentTrimestreState.eleveIndex++;

        // Si on a fini tous les élèves
        if (this.currentTrimestreState.eleveIndex >= this.currentTrimestreState.eleves.length) {
            this.fermerAttribuerTrimestreModal();
            return;
        }

        // Préparer le formulaire pour l'élève suivant
        const trimestre = this.evenements.find(e =>
            e.id === this.currentTrimestreState!.trimestreId);
        if (trimestre) {
            this.preparerFormulaireTrimestre(trimestre);
        }
    }

    /**
     * Enregistre les notes d'un élève pour le trimestre.
     * Sauvegarde dans le store: une note par matière.
     */
    private enregistrerNotesTrimestreEleve(): void {
        if (!this.currentTrimestreState) return;

        const eleve = this.currentTrimestreState.eleves[this.currentTrimestreState.eleveIndex];
        if (!eleve) return;

        // Récupérer ou créer le tableau de notes
        let notesTrimestre = this.notesTrimestreStore.get(eleve.id) || [];

        // Enregistrer chaque matière
        this.formAttribuerTrimestre.forEach(ligne => {
            const noteTrimestre: NoteTrimestre = {
                id: Date.now() + Math.random(),
                eleveId: eleve.id,
                trimestreId: this.currentTrimestreState!.trimestreId,
                matiere: ligne.matiere,
                moyenneClasse: ligne.moyenneClasse,
                noteCompo: ligne.noteCompo,
                moyenne: ligne.moyenne,
                coefficient: ligne.coefficient,
                moyenneCoefficientee: ligne.moyenneCoefficientee,
                appreciation: ligne.appreciation,
                date: new Date().toISOString().split('T')[0]
            };
            notesTrimestre.push(noteTrimestre);
        });

        this.notesTrimestreStore.set(eleve.id, notesTrimestre);
    }

    /**
     * Ferme le popup d'attribution des notes de trimestre.
     */
    fermerAttribuerTrimestreModal(): void {
        this.showAttribuerTrimestreModal = false;
        this.currentTrimestreState = null;
        this.formAttribuerTrimestre = [];
    }

    /**
     * Calcul automatiquement la moyenne coefficiée lors de la saisie.
     * @param index Index de la ligne dans le formulaire
     */
    calculerMoyenneCoefficientee(index: number): void {
        const ligne = this.formAttribuerTrimestre[index];
        ligne.moyenneCoefficientee = ligne.moyenne * ligne.coefficient;
    }

    /** Retourne à l'accueil et réinitialise tout */
    retourAccueil(): void {
        this.mode = 'home';
        this.selectedClasse = null;
        this.selectedAnnee = null;
        this.showVoirModal = false;
        this.showElevesModal = null;
        this.selectedEleve = null;
        this.showGererClasseModal = null;
    }
}