import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { SchoolDataService, Cycle, Annee, Enseignant as ServiceEnseignant } from '../../core/services/school-data.service';

// ─── INTERFACES LOCALES (compatibles avec le template) ───────────
interface EnseignantLocal {
    id: number;
    prenom: string;
    nom: string;
    fullName: string;
    email: string;
    telephone: string;
    matierePrincipale: string;
    grade: string;
    dateEmbauche: string;
    affectations: { classe: string; matiere: string }[];
}

interface FormEnseignant {
    prenom: string;
    nom: string;
    dateNaiss: string;
    lieuNaiss: string;
    sexe: 'M' | 'F';
    nationalite: string;
    email: string;
    telephone: string;
    adresse: string;
    matierePrincipale: string;
    matiereSecondaire: string;
    grade: string;
    dateEmbauche: string;
    diplome: string;
    classe: string;
    classeSecondaire: string;
    affectations: { classe: string; matiere: string }[];
}

interface ModalAnnee {
    annee: string;
    classes: { nom: string; enseignants: EnseignantLocal[] }[];
}

interface ModalClasse {
    classe: string;
    enseignants: EnseignantLocal[];
}

@Component({
    selector: 'app-teachers',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './teachers.component.html',
    styleUrl: './teachers.component.scss'
})
export class TeachersComponent implements OnInit {

    private schoolData = inject(SchoolDataService);

    // ─── CYCLES (lus depuis le service pour cohérence) ─────────
    get cycles(): Cycle[] { return this.schoolData.cycles; }

    /** Liste de toutes les classes générées à partir des cycles */
    classesListe: string[] = [];

    /** Map classe → enseignants (alimentée par le service) */
    classesMap: Map<string, EnseignantLocal[]> = new Map();

    // ─── ÉTAT INTERFACE ────────────────────────────────────────
    cycleOuvert: Record<string, boolean> = {};
    vue: 'accueil' | 'gestion' = 'accueil';
    filtreAnneeCourante: string | null = null;
    cycleContexte: string | null = null;
    classeActive: string | null = null;
    ajoutGlobal = false;

    rechercheAccueil = '';
    rechercheClasse = '';
    rechercheEnseignant = '';

    // ─── MODALES ───────────────────────────────────────────────
    afficherModalEnseignant = false;        // Ajout / Édition
    afficherModalAnnee = false;             // Liste par année
    afficherModalClasse = false;            // Liste par classe
    showModalEnseignantDetail = false;      // Détail enseignant (nouveau)

    modalAnnee?: ModalAnnee;
    modalClasse?: ModalClasse;
    selectedEnseignantDetail: EnseignantLocal | null = null;

    // ─── FORMULAIRE MULTI‑ÉTAPES ──────────────────────────────
    etapeCourante = 1;
    modeEdition = false;
    enseignantEditeId: number | null = null;
    formData: FormEnseignant = this.creerFormulaireVide();

    // ═══════════════════════════════════════════════════════════
    //  INITIALISATION
    // ═══════════════════════════════════════════════════════════
    ngOnInit(): void {
        this.classesListe = this.genererListeClasses();
        this.initialiserEnseignantsParClasse();
        this.cycles.forEach((c, i) => this.cycleOuvert[c.nom] = i === 0);
    }

    /** Génére la liste de toutes les classes à partir des cycles */
    private genererListeClasses(): string[] {
        const classes: string[] = [];
        this.cycles.forEach(cycle => {
            cycle.annees.forEach(annee => {
                if (annee.filieres) {
                    annee.filieres.forEach(f => classes.push(`${annee.nom.split(' ')[0]} ${f}`));
                } else {
                    for (let i = 0; i < annee.nbClasses; i++) {
                        classes.push(`${annee.nom} ${String.fromCharCode(65 + i)}`);
                    }
                }
            });
        });
        return classes;
    }

    /** Remplit la map classesMap à partir du SchoolDataService */
    private initialiserEnseignantsParClasse(): void {
        this.classesListe.forEach(classe => {
            const enseignantsService = this.schoolData.enseignantsPourClasse(classe);
            this.classesMap.set(classe, enseignantsService.map(e => ({
                id: e.id,
                prenom: e.prenom,
                nom: e.nom,
                fullName: e.fullName || `${e.prenom} ${e.nom}`,
                email: e.email,
                telephone: e.telephone,
                matierePrincipale: e.matierePrincipale,
                grade: e.grade,
                dateEmbauche: e.dateEmbauche,
                affectations: e.affectations.filter(a => a.classe === classe)
            })));
        });
    }

    // ═══════════════════════════════════════════════════════════
    //  UTILITAIRES
    // ═══════════════════════════════════════════════════════════

    /** Retourne les classes d'une année donnée */
    recupererClassesParAnnee(anneeNom: string): string[] {
        return this.classesListe.filter(c => {
            const annee = this.cycles.flatMap(cy => cy.annees).find(a => a.nom === anneeNom);
            if (!annee) return false;
            if (annee.filieres) {
                return annee.filieres.includes(c.split(' ')[1]); // ex: "10ème S"
            }
            return c.startsWith(anneeNom);
        });
    }

    /** Retourne toutes les classes d'un cycle */
    recupererClassesParCycle(cycleNom: string): string[] {
        const cycle = this.cycles.find(c => c.nom === cycleNom);
        if (!cycle) return this.classesListe;
        let classes: string[] = [];
        cycle.annees.forEach(a => {
            classes = classes.concat(this.recupererClassesParAnnee(a.nom));
        });
        return classes;
    }

    /** Effectif d'une classe (= nombre d'enseignants) */
    effectifClasse(classe: string): number {
        return (this.classesMap.get(classe) || []).length;
    }

    /** Classes disponibles dans le formulaire (selon contexte) */
    get classesDisponiblesForm(): string[] {
        if (this.ajoutGlobal || !this.cycleContexte) return this.classesListe;
        return this.recupererClassesParCycle(this.cycleContexte);
    }

    /** Statistiques pour une carte d'année */
    calculerStatsAnnee(anneeNom: string): { totalEnseignants: number; nbClasses: number; nbMatieres: number } {
        const classes = this.recupererClassesParAnnee(anneeNom);
        const ensIds = new Set<number>();
        const matieresSet = new Set<string>();
        classes.forEach(c => {
            const enseignants = this.classesMap.get(c) || [];
            enseignants.forEach(e => {
                ensIds.add(e.id);
                e.affectations.forEach(a => matieresSet.add(a.matiere));
            });
        });
        return {
            totalEnseignants: ensIds.size,
            nbClasses: classes.length,
            nbMatieres: matieresSet.size
        };
    }

    /** Retourne les enseignants d'une classe (pour le dropdown) */
    getEnseignantsDeClasse(classe: string): EnseignantLocal[] {
        return this.classesMap.get(classe) || [];
    }

    // ═══════════════════════════════════════════════════════════
    //  NAVIGATION ACCUEIL
    // ═══════════════════════════════════════════════════════════

    anneesVisibles(cycle: Cycle): Annee[] {
        if (!this.rechercheAccueil) return cycle.annees;
        const terme = this.rechercheAccueil.toLowerCase();
        return cycle.annees.filter(a =>
            a.nom.toLowerCase().includes(terme) ||
            a.description.toLowerCase().includes(terme)
        );
    }

    basculerCycle(cycleNom: string): void {
        const dejaOuvert = this.cycleOuvert[cycleNom];
        this.cycles.forEach(c => this.cycleOuvert[c.nom] = false);
        this.cycleOuvert[cycleNom] = !dejaOuvert;
    }

    onRechercheAccueilChange(valeur: string): void {
        this.rechercheAccueil = valeur;
        if (valeur) {
            this.cycles.forEach(c => this.cycleOuvert[c.nom] = true);
        } else {
            this.cycles.forEach((c, idx) => this.cycleOuvert[c.nom] = idx === 0);
        }
    }

    /** Bouton "Gérer" → vue gestion filtrée sur l'année */
    ouvrirGestion(anneeNom: string): void {
        this.vue = 'gestion';
        this.filtreAnneeCourante = anneeNom;
        const cycle = this.cycles.find(c => c.annees.some(a => a.nom === anneeNom));
        this.cycleContexte = cycle ? cycle.nom : null;
        this.classeActive = null;
        this.rechercheClasse = '';
        this.rechercheEnseignant = '';
    }

    /** Bouton "Voir les enseignants" → modale par année */
    ouvrirModalAnnee(anneeNom: string): void {
        const classes = this.recupererClassesParAnnee(anneeNom).map(classe => ({
            nom: classe,
            enseignants: this.classesMap.get(classe) || []
        }));
        this.modalAnnee = { annee: anneeNom, classes };
        this.afficherModalAnnee = true;
    }

    /** Clic sur une classe dans le dropdown → modale d'une classe */
    ouvrirModalClasse(classe: string): void {
        this.modalClasse = {
            classe,
            enseignants: this.classesMap.get(classe) || []
        };
        this.afficherModalClasse = true;
    }

    // ═══════════════════════════════════════════════════════════
    //  VUE GESTION
    // ═══════════════════════════════════════════════════════════

    get classesFiltrees(): string[] {
        let base = [...this.classesListe];
        if (this.filtreAnneeCourante) {
            const prefixe = this.filtreAnneeCourante.split(' ')[0];
            base = base.filter(c => c.startsWith(prefixe));
        }
        if (this.rechercheClasse) {
            const t = this.rechercheClasse.toLowerCase();
            base = base.filter(c => c.toLowerCase().includes(t));
        }
        return base;
    }

    selectionnerClasse(classe: string): void {
        this.classeActive = classe;
        this.rechercheEnseignant = '';
    }

    get enseignantsFiltres(): EnseignantLocal[] {
        if (!this.classeActive) return [];
        const liste = this.classesMap.get(this.classeActive) || [];
        if (!this.rechercheEnseignant) return liste;
        const terme = this.rechercheEnseignant.toLowerCase();
        return liste.filter(e =>
            e.fullName.toLowerCase().includes(terme) ||
            e.matierePrincipale.toLowerCase().includes(terme)
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  FORMULAIRE AJOUT / ÉDITION
    // ═══════════════════════════════════════════════════════════

    private creerFormulaireVide(): FormEnseignant {
        return {
            prenom: '', nom: '', dateNaiss: '', lieuNaiss: '',
            sexe: 'M', nationalite: 'Malienne', email: '', telephone: '',
            adresse: '', matierePrincipale: '', matiereSecondaire: '',
            grade: 'Titulaire', dateEmbauche: '', diplome: '',
            classe: '', classeSecondaire: '',
            affectations: [{ classe: '', matiere: '' }]
        };
    }

    ouvrirModalAjout(global = false): void {
        if (!global && !this.classeActive) {
            alert('Sélectionnez d\'abord une classe à gauche.');
            return;
        }
        this.ajoutGlobal = global;
        this.modeEdition = false;
        this.enseignantEditeId = null;
        this.formData = this.creerFormulaireVide();
        this.formData.affectations = [{ classe: (!global && this.classeActive) ? this.classeActive : '', matiere: '' }];
        this.etapeCourante = 1;
        this.afficherModalEnseignant = true;
    }

    ouvrirModalEdition(ens: EnseignantLocal, classe: string): void {
        this.modeEdition = true;
        this.enseignantEditeId = ens.id;
        this.ajoutGlobal = false;
        this.formData = {
            ...this.creerFormulaireVide(),
            prenom: ens.prenom,
            nom: ens.nom,
            email: ens.email,
            telephone: ens.telephone,
            matierePrincipale: ens.matierePrincipale,
            grade: ens.grade,
            dateEmbauche: ens.dateEmbauche,
            affectations: ens.affectations.length > 0 ? [...ens.affectations] : [{ classe, matiere: ens.matierePrincipale }]
        };
        this.etapeCourante = 1;
        this.afficherModalEnseignant = true;
    }

    allerEtape(etape: number): void { this.etapeCourante = etape; }

    ajouterAffectationForm(): void {
        if (!this.formData.affectations) this.formData.affectations = [];
        this.formData.affectations.push({ classe: '', matiere: this.formData.matierePrincipale || '' });
    }

    supprimerAffectationForm(index: number): void {
        this.formData.affectations.splice(index, 1);
    }

    enregistrerEnseignant(): void {
        if (!this.formData.prenom || !this.formData.nom) {
            alert('Prénom et Nom sont obligatoires.');
            return;
        }
        const affectations = (this.formData.affectations || []).filter(a => a.classe);
        if (affectations.length === 0) {
            alert('Veuillez affecter au moins une classe.');
            return;
        }

        const nouvelEns: EnseignantLocal = {
            id: this.modeEdition && this.enseignantEditeId ? this.enseignantEditeId : Date.now(),
            prenom: this.formData.prenom,
            nom: this.formData.nom,
            fullName: `${this.formData.prenom} ${this.formData.nom}`,
            email: this.formData.email || `${this.formData.prenom.toLowerCase()}.${this.formData.nom.toLowerCase()}@ecole.ml`,
            telephone: this.formData.telephone || '+223 00000000',
            matierePrincipale: affectations[0]?.matiere || this.formData.matierePrincipale,
            grade: this.formData.grade,
            dateEmbauche: this.formData.dateEmbauche,
            affectations
        };

        // Retire l'enseignant de toutes les classes en cas d'édition
        if (this.modeEdition && this.enseignantEditeId) {
            for (const [classe, liste] of this.classesMap.entries()) {
                this.classesMap.set(classe, liste.filter(e => e.id !== this.enseignantEditeId));
            }
        }

        // Ajoute dans chaque classe affectée
        for (const aff of affectations) {
            const cible = this.classesMap.get(aff.classe) || [];
            if (!cible.find(e => e.id === nouvelEns.id)) {
                cible.push(nouvelEns);
                this.classesMap.set(aff.classe, cible);
            }
        }

        this.classeActive = affectations[0].classe;
        this.afficherModalEnseignant = false;
    }

    supprimerEnseignant(id: number): void {
        if (!this.classeActive) return;
        if (!confirm('Supprimer cet enseignant de cette classe ?')) return;
        const liste = this.classesMap.get(this.classeActive) || [];
        this.classesMap.set(this.classeActive, liste.filter(e => e.id !== id));
    }

    // ═══════════════════════════════════════════════════════════
    //  DÉTAIL ENSEIGNANT (NOUVEAU)
    // ═══════════════════════════════════════════════════════════

    /** Ouvre le popup de détail d'un enseignant (clic dans le dropdown) */
    ouvrirDetailEnseignant(ens: EnseignantLocal): void {
        this.selectedEnseignantDetail = { ...ens };
        this.showModalEnseignantDetail = true;
    }

    /** Depuis le popup détail, ouvre le formulaire d'édition */
    editerEnseignantDepuisDetail(): void {
        if (!this.selectedEnseignantDetail) return;
        const ens = this.selectedEnseignantDetail;
        this.showModalEnseignantDetail = false;
        this.ouvrirModalEdition(ens, ens.affectations[0]?.classe || '');
    }

    // ═══════════════════════════════════════════════════════════
    //  NAVIGATION GLOBALE
    // ═══════════════════════════════════════════════════════════

    revenirAccueil(): void {
        this.vue = 'accueil';
        this.filtreAnneeCourante = null;
        this.cycleContexte = null;
        this.classeActive = null;
    }

    fermerToutesModales(): void {
        this.afficherModalAnnee = false;
        this.afficherModalClasse = false;
        this.showModalEnseignantDetail = false;
    }

    imprimer(): void { window.print(); }

    trackByEnsId(_: number, ens: EnseignantLocal): number { return ens.id; }
}