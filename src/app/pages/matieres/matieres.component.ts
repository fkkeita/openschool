import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import {
    SchoolDataService, Cycle, Annee, Matiere, Enseignant
} from '../../core/services/school-data.service';

/**
 * ═══════════════════════════════════════════════════════════
 * MatieresComponent — Gestion des Matières
 * ═══════════════════════════════════════════════════════════
 * Ce composant gère deux vues principales :
 *   1. VUE ACCUEIL  : accordéon des cycles avec cartes par année
 *      Chaque carte affiche 3 stats (Matières / Classes / Enseignants)
 *      avec un menu déroulant au survol pour chacune.
 *      Deux boutons : "Voir les matières" et "Gérer"
 *
 *   2. VUE GESTION  : panneau double colonne
 *      Gauche  : liste des classes de l'année sélectionnée
 *      Droite  : liste des matières de la classe sélectionnée
 *      (Identique à la vue Gestion des Élèves)
 *
 * Données : toutes proviennent du SchoolDataService (source unique).
 *
 * NOUVELLES FONCTIONNALITÉS :
 *   - Clic sur une classe dans le dropdown → popup listant ses matières.
 *   - Clic sur une matière dans le dropdown → popup de détails/modification.
 *   - Clic sur un enseignant dans le dropdown → popup de détails.
 */
@Component({
    selector: 'app-matieres',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './matieres.component.html',
    styleUrl: './matieres.component.scss'
})
export class MatieresComponent implements OnInit {

    private schoolData = inject(SchoolDataService);

    // ── ÉTAT DE LA VUE ────────────────────────────────────────────────────────
    public vue: 'accueil' | 'gestion' = 'accueil';
    public rechercheAccueil = '';
    public cycleOuvert: Record<string, boolean> = { '1er CYCLE': true };

    // ── SÉLECTION ─────────────────────────────────────────────────────────────
    public selectedAnnee: Annee | null = null;
    public currentCycleContext: string | null = null;

    // ── VUE GESTION : panneau gauche (classes) ────────────────────────────────
    public classeActive: string | null = null;
    public rechercheClasse = '';
    public rechercheMatiere = '';

    // ── MODALES ───────────────────────────────────────────────────────────────
    public showModalMatiere = false;        // Ajout / Édition matière
    public showModalListe = false;          // "Voir les matières" (année)
    public showModalMatiereDetail = false;  // Détail d'une matière (depuis dropdown)
    public showModalClasseMatieres = false; // Matières d'une classe (depuis dropdown)
    public showModalEnseignantDetail = false; // Détail d'un enseignant

    public modalAnneeTitre = '';
    public matieresAnnee: Matiere[] = [];

    // Matière sélectionnée pour le popup de détail/édition
    public selectedMatiereDetail: Matiere | null = null;

    // Classe sélectionnée pour le popup "Matières de la classe"
    public selectedClassePourPopup: string = '';
    public matieresDeLaClasse: Matiere[] = [];

    // Enseignant sélectionné pour le popup de détail
    public selectedEnseignantDetail: Enseignant | null = null;
    public classesDeLEnseignant: string[] = [];

    public editMode = false;
    public currentStep = 1;

    public formData: any = {
        nom: '',
        code: '',
        coefficient: 1,
        couleur: '#4a6cf7',
        description: '',
        programme: '',
        affectations: []
    };

    get cycles(): Cycle[] { return this.schoolData.cycles; }
    get matieres(): Matiere[] { return this.schoolData.matieres; }
    get enseignants(): Enseignant[] { return this.schoolData.enseignants; }

    ngOnInit(): void { }

    // ══════════════════════════════════════════════════════════════════════════
    //  ACCUEIL
    // ══════════════════════════════════════════════════════════════════════════

    basculerCycle(cycleNom: string): void {
        this.cycleOuvert[cycleNom] = !this.cycleOuvert[cycleNom];
    }

    onRechercheAccueilChange(val: string): void {
        this.rechercheAccueil = val.toLowerCase();
    }

    anneesVisibles(cycle: Cycle): Annee[] {
        if (!this.rechercheAccueil) return cycle.annees;
        return cycle.annees.filter(a =>
            a.nom.toLowerCase().includes(this.rechercheAccueil) ||
            a.description.toLowerCase().includes(this.rechercheAccueil)
        );
    }

    getStatsPourAnnee(anneeNom: string): any {
        const classes = this.schoolData.classesPourAnnee(anneeNom);
        return {
            nbMatieres: this.matieres.filter(m => m.annees.includes(anneeNom)).length || 0,
            nbClasses: classes.length,
            nbEnseignants: this.enseignants.filter(e =>
                e.affectations.some(a => classes.includes(a.classe))
            ).length || 0
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  DROPDOWNS
    // ══════════════════════════════════════════════════════════════════════════

    getMatieresPourAnnee(anneeNom: string): Matiere[] {
        return this.matieres.filter(m => m.annees.includes(anneeNom));
    }

    getClassesDeLAnnee(anneeNom: string): string[] {
        return this.schoolData.classesPourAnnee(anneeNom);
    }

    getEnseignantsPourAnnee(anneeNom: string): Enseignant[] {
        const classes = this.schoolData.classesPourAnnee(anneeNom);
        return this.enseignants.filter(e =>
            e.affectations.some(a => classes.includes(a.classe))
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  ACTIONS DEPUIS LES DROPDOWNS
    // ══════════════════════════════════════════════════════════════════════════

    /** Ouvre le popup des matières d'une classe (depuis le dropdown "CLASSES") */
    ouvrirPopupClasse(classe: string, anneeNom: string): void {
        this.selectedClassePourPopup = classe;
        // Récupère les matières de l'année (la classe n'est pas discriminante ici,
        // car les matières sont liées aux années, pas aux classes individuelles)
        this.matieresDeLaClasse = this.getMatieresPourAnnee(anneeNom);
        this.showModalClasseMatieres = true;
    }

    /** Ouvre le popup de détail d'une matière (depuis le dropdown "MATIÈRES") */
    ouvrirDetailMatiere(matiere: Matiere): void {
        this.selectedMatiereDetail = matiere;
        this.showModalMatiereDetail = true;
    }

    /** Depuis le popup détail matière, ouvre le formulaire d'édition */
    editerMatiereDepuisDetail(): void {
        if (!this.selectedMatiereDetail) return;
        this.showModalMatiereDetail = false;
        this.ouvrirModalEdition(this.selectedMatiereDetail);
    }

    /** Ouvre le popup de détail d'un enseignant (depuis le dropdown "ENSEIGNANTS") */
    ouvrirDetailEnseignant(enseignant: Enseignant): void {
        this.selectedEnseignantDetail = enseignant;
        this.classesDeLEnseignant = this.schoolData.classesPourEnseignant(enseignant.id);
        this.showModalEnseignantDetail = true;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  VUE GESTION
    // ══════════════════════════════════════════════════════════════════════════

    selectAnnee(annee: Annee): void {
        this.selectedAnnee = annee;
        this.currentCycleContext = this.cycles.find(c =>
            c.annees.includes(annee)
        )?.nom || null;
        this.classeActive = null;
        this.rechercheClasse = '';
        this.rechercheMatiere = '';
        this.vue = 'gestion';
    }

    revenirAccueil(): void {
        this.selectedAnnee = null;
        this.classeActive = null;
        this.vue = 'accueil';
    }

    get classesFiltrees(): string[] {
        const toutes = this.selectedAnnee
            ? this.schoolData.classesPourAnnee(this.selectedAnnee.nom)
            : [];
        if (!this.rechercheClasse) return toutes;
        return toutes.filter(c =>
            c.toLowerCase().includes(this.rechercheClasse.toLowerCase())
        );
    }

    selectionnerClasse(classe: string): void {
        this.classeActive = classe;
        this.rechercheMatiere = '';
    }

    get matieresFiltreesGestion(): Matiere[] {
        if (!this.classeActive || !this.selectedAnnee) return [];
        const anneeMatières = this.matieres.filter(m =>
            m.annees.includes(this.selectedAnnee!.nom)
        );
        const filtrees = this.rechercheMatiere
            ? anneeMatières.filter(m =>
                m.nom.toLowerCase().includes(this.rechercheMatiere.toLowerCase()) ||
                m.code.toLowerCase().includes(this.rechercheMatiere.toLowerCase())
            )
            : anneeMatières;
        return filtrees;
    }

    nbMatieresClasse(classe: string): number {
        if (!this.selectedAnnee) return 0;
        return this.matieres.filter(m => m.annees.includes(this.selectedAnnee!.nom)).length;
    }

    getProfPourMatiere(mat: Matiere): string {
        const ens = this.enseignants.find(e =>
            e.affectations.some(a =>
                a.classe === this.classeActive &&
                (a.matiere === mat.nom || a.matiere === mat.code)
            )
        );
        return ens ? `${ens.prenom} ${ens.nom}` : 'Non affecté';
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  MODALE VOIR LES MATIÈRES
    // ══════════════════════════════════════════════════════════════════════════

    ouvrirModalListe(anneeNom: string): void {
        this.modalAnneeTitre = anneeNom;
        this.matieresAnnee = this.getMatieresPourAnnee(anneeNom);
        this.showModalListe = true;
    }

    getMatieresParClasse(anneeNom: string, classeNom: string): Matiere[] {
        return this.matieres.filter(m => m.annees.includes(anneeNom));
    }

    getAffectationsMatClasse(mat: Matiere, classeNom: string): any[] {
        const res: any[] = [];
        this.enseignants.forEach(e => {
            e.affectations.forEach((a: any) => {
                if (a.classe === classeNom &&
                    (a.matiere === mat.nom || a.matiere === mat.code)) {
                    res.push({ teacherId: e.id, classe: a.classe });
                }
            });
        });
        return res;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  FORMULAIRE AJOUT / ÉDITION
    // ══════════════════════════════════════════════════════════════════════════

    ouvrirModalAjout(): void {
        this.editMode = false;
        this.currentStep = 1;
        this.formData = {
            nom: '', code: '', coefficient: 1,
            couleur: '#4a6cf7',
            description: '', programme: '',
            affectations: [{ teacherId: null, classe: '' }]
        };
        this.showModalMatiere = true;
    }

    ouvrirModalEdition(m: Matiere): void {
        this.editMode = true;
        this.currentStep = 1;
        this.formData = {
            ...m,
            affectations: this.getAffectationsPourMatiere(m.nom)
        };
        if (this.formData.affectations.length === 0) {
            this.formData.affectations.push({ teacherId: null, classe: '' });
        }
        this.showModalMatiere = true;
    }

    goToStep(step: number): void {
        if (step >= 1 && step <= 4) this.currentStep = step;
    }

    addAffectationRow(): void {
        this.formData.affectations.push({ teacherId: null, classe: '' });
    }

    removeAffectationRow(i: number): void {
        this.formData.affectations.splice(i, 1);
        if (this.formData.affectations.length === 0) this.addAffectationRow();
    }

    private getAffectationsPourMatiere(matiereNom: string): any[] {
        const res: any[] = [];
        this.enseignants.forEach(e => {
            e.affectations.forEach(a => {
                if (a.matiere === matiereNom)
                    res.push({ teacherId: e.id, classe: a.classe });
            });
        });
        return res;
    }

    saveMatiere(): void {
        if (this.editMode) {
            const idx = this.matieres.findIndex(m => m.id === this.formData.id);
            if (idx !== -1) Object.assign(this.matieres[idx], this.formData);
        } else {
            const newId = Math.max(0, ...this.matieres.map(m => m.id)) + 1;
            this.matieres.push({
                id: newId,
                ...this.formData,
                cycle: this.currentCycleContext || '1er CYCLE',
                annees: this.selectedAnnee ? [this.selectedAnnee.nom] : ['1ère Année']
            });
        }
        this.showModalMatiere = false;
    }

    supprimerMatiere(id: number): void {
        if (confirm('Supprimer cette matière définitivement ?')) {
            const idx = this.matieres.findIndex(m => m.id === id);
            if (idx !== -1) this.matieres.splice(idx, 1);
        }
    }

    getEnseignantNom(id: any): string {
        const e = this.enseignants.find(x => x.id == id);
        return e ? `${e.prenom} ${e.nom}` : 'Non défini';
    }

    getClassesDuCycle(cycleNom: string | null): string[] {
        if (!cycleNom) return this.schoolData.toutesLesClasses();
        const cycle = this.cycles.find(c => c.nom === cycleNom);
        if (!cycle) return [];
        return cycle.annees.flatMap(a => this.schoolData.classesPourAnnee(a.nom));
    }
}