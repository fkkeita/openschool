import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { SchoolDataService, Cycle, Annee } from '../../core/services/school-data.service';

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Eleve {
    id: number;
    prenom: string;
    nom: string;
    classe: string;
}

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

interface EvenementCollectif {
    id: number;
    classe: string;
    type: 'trimestre' | 'composition' | 'examen';
    titre: string;
    date: string;
    matieres: {
        nom: string;
        moyenneClasse: number;
        noteMax: number;
        moyenne: number;
        coefficient: number;
        moyenneCoefficientee: number;
        appreciation: string;
    }[];
    totalCoefficient: number;
    totalMoyenneCoefficientee: number;
    moyenneGenerale: number;
}

@Component({
    selector: 'app-notes',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './notes.component.html',
    styleUrl: './notes.component.scss'
})
export class NotesComponent implements OnInit {

    private schoolData = inject(SchoolDataService);

    // ── Navigation accueil ────────────────────────────────────────────────────
    public rechercheAccueil = '';
    public cycleOuvert: Record<string, boolean> = {};

    // ── Mode d'affichage ──────────────────────────────────────────────────────
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

    // ── Données ───────────────────────────────────────────────────────────────
    public elevesParClasse: Map<string, Eleve[]> = new Map();
    public notesStore: Map<number, NoteEntry[]> = new Map();
    public evenements: EvenementCollectif[] = [];

    // Formulaire devoir/interro
    public formDevoir: any = { titre: '', matiere: '', date: '', type: 'devoir' };

    // Formulaire événement collectif
    public formEvenement: any = {
        titre: '', type: 'trimestre', date: '',
        matieres: [] as any[],
        totalCoefficient: 0,
        totalMoyenneCoefficientee: 0,
        moyenneGenerale: 0,
        nouvelleMatiere: { nom: '', moyenneClasse: 0, noteMax: 20, moyenne: 0, coefficient: 1, appreciation: '' }
    };

    // Formulaire attribution notes
    public formAttribuer: { eleveId: number; note: number }[] = [];

    get cycles(): Cycle[] { return this.schoolData.cycles; }

    // ═══════════════════════ INITIALISATION ═══════════════════════
    ngOnInit(): void {
        this.cycles.forEach((c, i) => this.cycleOuvert[c.nom] = i === 0);
        this.genererEleves();
    }

    private genererEleves(): void {
        this.classesListe.forEach(classe => {
            const effectif = Math.floor(Math.random() * 10) + 15;
            const eleves: Eleve[] = [];
            for (let i = 1; i <= effectif; i++) {
                const id = Date.now() + i;
                eleves.push({ id, prenom: `Élève${i}`, nom: classe.replace(' ', '_'), classe });
                this.notesStore.set(id, []);
            }
            this.elevesParClasse.set(classe, eleves);
        });
    }

    get classesListe(): string[] {
        let classes: string[] = [];
        this.cycles.forEach(cycle => {
            cycle.annees.forEach(annee => {
                const noms = this.schoolData.classesPourAnnee(annee.nom);
                classes = classes.concat(noms);
            });
        });
        return classes;
    }

    // ═══════════════════════ ACCUEIL ═══════════════════════
    basculerCycle(nom: string): void { this.cycleOuvert[nom] = !this.cycleOuvert[nom]; }

    anneesVisibles(cycle: Cycle): Annee[] {
        if (!this.rechercheAccueil) return cycle.annees;
        const t = this.rechercheAccueil.toLowerCase();
        return cycle.annees.filter(a =>
            a.nom.toLowerCase().includes(t) || a.description.toLowerCase().includes(t));
    }

    statsPourAnnee(anneeNom: string): any {
        const classes = this.schoolData.classesPourAnnee(anneeNom);
        return {
            nbClasses: classes.length,
            nbEleves: classes.reduce((sum, c) => sum + (this.elevesParClasse.get(c)?.length || 0), 0),
            classes
        };
    }

    getClassesAnnee(annee: Annee | null): string[] {
        if (!annee) return [];
        return this.schoolData.classesPourAnnee(annee.nom);
    }

    // ═══════════════════════ VOIR LES NOTES ═══════════════════════
    ouvrirVoir(annee: Annee): void {
        this.voirAnnee = annee;
        this.showVoirModal = true;
    }

    selectClasseVoir(classe: string): void {
        this.showVoirModal = false;
        this.selectedClasse = classe;
        const eleves = this.elevesParClasse.get(classe) || [];
        this.showElevesModal = eleves;
    }

    fermerElevesModal(): void {
        this.showElevesModal = null;
        this.selectedClasse = null;
    }

    selectEleve(eleve: Eleve): void {
        this.selectedEleve = eleve;
        this.showElevesModal = null;
    }

    fermerNotesEleve(): void {
        this.selectedEleve = null;
    }

    getNotesEleve(eleveId: number): NoteEntry[] {
        return this.notesStore.get(eleveId) || [];
    }

    // ═══════════════════════ GÉRER ═══════════════════════
    ouvrirGerer(annee: Annee): void {
        this.selectedAnnee = annee;
        this.mode = 'gerer-picker';
    }

    selectClasseGerer(classe: string): void {
        this.selectedClasse = classe;
        this.showGererClasseModal = classe;
    }

    fermerGererClasseModal(): void {
        this.showGererClasseModal = null;
        this.selectedClasse = null;
    }

    // ═══════════════════════ CRÉATION DEVOIR / INTERRO ═══════════════════════
    ouvrirCreationDevoir(): void {
        this.formDevoir = { titre: '', matiere: '', date: new Date().toISOString().split('T')[0], type: 'devoir' };
        this.showCreateDevoirModal = true;
    }

    creerDevoir(): void {
        if (!this.formDevoir.titre || !this.formDevoir.matiere) return;
        this.showCreateDevoirModal = false;
        this.ouvrirAttribuerNotes(this.formDevoir.type, this.formDevoir.titre);
    }

    // ═══════════════════════ CRÉATION TRIMESTRE / COMPO / EXAMEN ═══════════════════════
    ouvrirCreationEvenement(): void {
        this.formEvenement = {
            titre: '', type: 'trimestre', date: new Date().toISOString().split('T')[0],
            matieres: [],
            totalCoefficient: 0, totalMoyenneCoefficientee: 0, moyenneGenerale: 0,
            nouvelleMatiere: { nom: '', moyenneClasse: 0, noteMax: 20, moyenne: 0, coefficient: 1, appreciation: '' }
        };
        this.showCreateEvenementModal = true;
    }

    ajouterMatiereEvenement(): void {
        const m = this.formEvenement.nouvelleMatiere;
        if (!m.nom) return;
        const moyCoef = m.moyenne * m.coefficient;
        this.formEvenement.matieres.push({ ...m, moyenneCoefficientee: moyCoef });
        this.formEvenement.nouvelleMatiere = { nom: '', moyenneClasse: 0, noteMax: 20, moyenne: 0, coefficient: 1, appreciation: '' };
        this.recalculerTotauxEvenement();
    }

    supprimerMatiereEvenement(index: number): void {
        this.formEvenement.matieres.splice(index, 1);
        this.recalculerTotauxEvenement();
    }

    recalculerTotauxEvenement(): void {
        let totalCoef = 0, totalMoyCoef = 0;
        this.formEvenement.matieres.forEach((m: any) => {
            totalCoef += m.coefficient;
            totalMoyCoef += m.moyenne * m.coefficient;
        });
        this.formEvenement.totalCoefficient = totalCoef;
        this.formEvenement.totalMoyenneCoefficientee = totalMoyCoef;
        this.formEvenement.moyenneGenerale = totalCoef > 0 ? totalMoyCoef / totalCoef : 0;
    }

    enregistrerEvenement(): void {
        if (!this.formEvenement.titre || !this.selectedClasse) return;
        const evenement: EvenementCollectif = {
            id: Date.now(),
            classe: this.selectedClasse!,
            type: this.formEvenement.type,
            titre: this.formEvenement.titre,
            date: this.formEvenement.date,
            matieres: this.formEvenement.matieres.map((m: any) => ({ ...m })),
            totalCoefficient: this.formEvenement.totalCoefficient,
            totalMoyenneCoefficientee: this.formEvenement.totalMoyenneCoefficientee,
            moyenneGenerale: this.formEvenement.moyenneGenerale
        };
        this.evenements.push(evenement);
        this.showCreateEvenementModal = false;
        this.ouvrirAttribuerNotes(evenement.type, evenement.titre, evenement.id);
    }

    // ═══════════════════════ ATTRIBUTION NOTES ═══════════════════════
    ouvrirAttribuerNotes(type: string, titre: string, evenementId?: number): void {
        this.showAttribuerNotesModal = { type, titre, evenementId };
        const eleves = this.elevesParClasse.get(this.selectedClasse!) || [];
        this.formAttribuer = eleves.map(e => ({ eleveId: e.id, note: 0 }));
    }

    enregistrerAttribution(): void {
        if (!this.showAttribuerNotesModal) return;
        const type = this.showAttribuerNotesModal.type as NoteEntry['type'];
        const titre = this.showAttribuerNotesModal.titre;
        const evenementId = this.showAttribuerNotesModal.evenementId;
        const matiere = evenementId ? this.getMatiereEvenement(evenementId) : this.formDevoir.matiere;

        this.formAttribuer.forEach(att => {
            if (att.note < 0) return;
            const note: NoteEntry = {
                id: Date.now() + Math.random(),
                eleveId: att.eleveId,
                matiere: matiere || '',
                type,
                titre,
                note: att.note,
                date: new Date().toISOString().split('T')[0],
                coefficient: evenementId ? this.getCoefficientEvenement(evenementId, matiere) : undefined
            };
            const notesEleve = this.notesStore.get(att.eleveId) || [];
            notesEleve.push(note);
            this.notesStore.set(att.eleveId, notesEleve);
        });
        this.showAttribuerNotesModal = null;
    }

    private getMatiereEvenement(evenementId: number): string {
        const ev = this.evenements.find(e => e.id === evenementId);
        return ev?.matieres[0]?.nom || '';
    }

    private getCoefficientEvenement(evenementId: number, matiere: string): number {
        const ev = this.evenements.find(e => e.id === evenementId);
        const mat = ev?.matieres.find(m => m.nom === matiere);
        return mat?.coefficient || 1;
    }

    // ═══════════════════════ UTILITAIRES ═══════════════════════
    /** Retourne le nom complet d'un élève à partir de son ID */
    getEleveName(id: number): string {
        for (const eleves of this.elevesParClasse.values()) {
            const found = eleves.find(e => e.id === id);
            if (found) return `${found.prenom} ${found.nom}`;
        }
        return '';
    }

    /** Retourne la liste des matières enseignées dans la classe sélectionnée */
    getMatieresClasse(): string[] {
        if (!this.selectedClasse) return [];
        return this.schoolData.matieresPourClasse(this.selectedClasse).map(m => m.matiere);
    }

    // ═══════════════════════ RETOUR ═══════════════════════
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