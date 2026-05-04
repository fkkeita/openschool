import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { SchoolDataService, Cycle, Annee, Eleve } from '../../core/services/school-data.service';

// ─── Interfaces locales (inchangées) ──────────────────────────
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
    matieres: string[];
}

interface NoteTrimestre {
    id: number;
    eleveId: number;
    trimestreId: number;
    matiere: string;
    moyenneClasse: number;
    noteCompo: number;
    moyenne: number;
    coefficient: number;
    moyenneCoefficientee: number;
    appreciation: string;
    date: string;
}

interface FormDevoir {
    titre: string;
    type: 'devoir' | 'interrogation';
    matiere: string;
    date: string;
}

interface FormTrimestre {
    titre: string;
    type: 'trimestre' | 'composition' | 'examen';
    date: string;
    matieres: string[];
}

interface LigneAttributionTrimestre {
    matiere: string;
    moyenneClasse: number;
    noteCompo: number;
    moyenne: number;
    coefficient: number;
    moyenneCoefficientee: number;
    appreciation: string;
}

/**
 * ==================================================================================================================================
 * ÉTAT TRIMESTRE - Gère l'état de la saisie des notes de trimestre
 * 
 * Ce système permet de:
 * - Naviguer librement entre les élèves (pas seulement séquentiel)
 * - Chercher rapidement un élève avec le champ de recherche
 * - Conserver les notes déjà saisies pour chaque élève (même si on change d'élève)
 * - Enregistrer les notes de l'élève actuel à tout moment
 * - Enregistrer TOUS les élèves quand on a fini
 * ==================================================================================================================================
 */
interface AttributionTrimestreState {
    opened: boolean;                    // Le modal est ouvert
    trimestreId: number;              // ID du trimestre/composition/examen
    eleveIndex: number;                // Index de l'élève actuellement sélectionné (pour la progression)
    eleves: Eleve[];                  // Liste de TOUS les élèves de la classe
    elevesEnregistres: Set<number>;    // Set des IDs des élèves AYANT CLICQUÉ sur "Enregistrer cet élève"
}

/**
 * ==================================================================================================================================
 * DONNÉES TEMPORAIRES PAR ÉLÈVE - Cache pour conserver les notes en cours de saisie
 * 
 * Clé: eleveId (number)
 * Valeur: LigneAttributionTrimestre[] (les lignes du formulaire pour cet élève)
 * 
 * Quand l'utilisateur clique sur un élève:
 * 1. On vérifie si des notes temporaires existent déjà pour cet élève
 * 2. Si oui, on les charge dans le formulaire
 * 3. Si non, on crée un formulaire vide
 * 
 * Quand l'utilisateur change d'élève:
 * 1. On sauvegarde les notes actuelles dans le cache temporaire
 * 2. On charge les notes de l'élève sélectionné (ou formulaire vide)
 * ==================================================================================================================================
 */
interface DonneesTempTrimestre {
    [eleveId: number]: LigneAttributionTrimestre[];
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

    // Navigation
    public rechercheAccueil = '';
    public cycleOuvert: Record<string, boolean> = {};

    // Mode
    public mode: 'home' | 'gerer' | 'voir' | 'gerer-picker' = 'home';
    public selectedAnnee: Annee | null = null;
    public selectedClasse: string | null = null;

    // Popups
    public showVoirModal = false;
    public voirAnnee: Annee | null = null;
    public showElevesModal: Eleve[] | null = null;
    public selectedEleve: Eleve | null = null;
    public showGererClasseModal: string | null = null;
    public showCreateDevoirModal = false;
    public showCreateEvenementModal = false;
    public showAttribuerNotesModal: { type: string; titre: string; evenementId?: number } | null = null;
    public showAttribuerTrimestreModal = false;

    // Stores de notes
    public notesStore: Map<number, NoteEntry[]> = new Map();
    public notesTrimestreStore: Map<number, NoteTrimestre[]> = new Map();
    public evenements: EvenementCollectif[] = [];

    // Formulaires
    public formDevoir: FormDevoir = this.creerFormDevoirVide();
    public formTrimestre: FormTrimestre = this.creerFormTrimestreVide();
    public formAttribuer: { eleveId: number; note: number }[] = [];
    public formAttribuerTrimestre: LigneAttributionTrimestre[] = [];

    // ═══════════════ ACCESSEURS ═══════════════
    get cycles(): Cycle[] { return this.schoolData.cycles; }

    get classesListe(): string[] {
        return this.schoolData.toutesLesClasses();
    }

    // ═══════════════ INITIALISATION ═══════════════
    ngOnInit(): void {
        this.cycles.forEach((c, i) => this.cycleOuvert[c.nom] = i === 0);
        // Les élèves sont déjà chargés par le service, pas d'initialisation locale.
    }

    // ─── Helpers ────────────────────────────────────
    private creerFormDevoirVide(): FormDevoir {
        return { titre: '', type: 'devoir', matiere: '', date: new Date().toISOString().split('T')[0] };
    }
    private creerFormTrimestreVide(): FormTrimestre {
        return { titre: '', type: 'trimestre', date: new Date().toISOString().split('T')[0], matieres: [] };
    }

    basculerCycle(nom: string): void { this.cycleOuvert[nom] = !this.cycleOuvert[nom]; }

    anneesVisibles(cycle: Cycle): Annee[] {
        if (!this.rechercheAccueil) return cycle.annees;
        const t = this.rechercheAccueil.toLowerCase();
        return cycle.annees.filter(a => a.nom.toLowerCase().includes(t) || a.description.toLowerCase().includes(t));
    }

    statsPourAnnee(anneeNom: string): any {
        const classes = this.schoolData.classesPourAnnee(anneeNom);
        return {
            nbClasses: classes.length,
            nbEleves: classes.reduce((sum, c) => sum + this.schoolData.elevesPourClasse(c).length, 0),
            classes
        };
    }

    getClassesAnnee(annee: Annee | null): string[] {
        return annee ? this.schoolData.classesPourAnnee(annee.nom) : [];
    }

    getMatieresClasse(classe: string): string[] {
        return classe ? this.schoolData.matieresPourClasse(classe).map(m => m.matiere) : [];
    }

    getEleveName(id: number): string {
        const eleve = this.schoolData.tousLesEleves.find(e => e.id === id);
        return eleve ? `${eleve.prenom} ${eleve.nom}` : '';
    }

    // ═══════════════ VOIR LES NOTES ═══════════════
    ouvrirVoir(annee: Annee): void {
        this.voirAnnee = annee;
        this.showVoirModal = true;
    }

    selectClasseVoir(classe: string): void {
        this.showVoirModal = false;
        this.selectedClasse = classe;
        this.showElevesModal = this.schoolData.elevesPourClasse(classe);
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

    // ═══════════════ GÉRER ═══════════════
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

    // ═══════════════ CRÉATION DEVOIR / INTERRO ═══════════════
    ouvrirCreationDevoir(): void {
        this.formDevoir = this.creerFormDevoirVide();
        this.showCreateDevoirModal = true;
    }

    creerDevoir(): void {
        if (!this.formDevoir.titre || !this.formDevoir.matiere) return;
        this.showCreateDevoirModal = false;
        this.ouvrirAttribuerNotes(this.formDevoir.type, this.formDevoir.titre);
    }

    // ═══════════════ CRÉATION TRIMESTRE / COMPO / EXAMEN ═══════════════
    ouvrirCreationEvenement(): void {
        this.formTrimestre = this.creerFormTrimestreVide();
        this.showCreateEvenementModal = true;
    }

    toggleMatiereTrimestre(matiere: string): void {
        const index = this.formTrimestre.matieres.indexOf(matiere);
        index === -1 ? this.formTrimestre.matieres.push(matiere) : this.formTrimestre.matieres.splice(index, 1);
    }

    isMatiereSelected(matiere: string): boolean {
        return this.formTrimestre.matieres.includes(matiere);
    }

    enregistrerEvenement(): void {
        if (!this.formTrimestre.titre || !this.selectedClasse || this.formTrimestre.matieres.length === 0) return;
        const evenement: EvenementCollectif = {
            id: Date.now(),
            classe: this.selectedClasse,
            type: this.formTrimestre.type,
            titre: this.formTrimestre.titre,
            date: this.formTrimestre.date,
            matieres: [...this.formTrimestre.matieres]
        };
        this.evenements.push(evenement);
        this.showCreateEvenementModal = false;
        this.ouvrirAttribuerTrimestre(evenement);
    }

    // ═══════════════ ATTRIBUTION NOTES SIMPLES ═══════════════
    ouvrirAttribuerNotes(type: string, titre: string, _evenementId?: number): void {
        this.showAttribuerNotesModal = { type, titre };
        const eleves = this.schoolData.elevesPourClasse(this.selectedClasse!);
        this.formAttribuer = eleves.map(e => ({ eleveId: e.id, note: 0 }));
    }

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
                date: new Date().toISOString().split('T')[0]
            };
            const notesEleve = this.notesStore.get(att.eleveId) || [];
            notesEleve.push(note);
            this.notesStore.set(att.eleveId, notesEleve);
        });
        this.showAttribuerNotesModal = null;
    }

    /**
     * ==================================================================================================================================
     * ATTRIBUTION NOTES DE TRIMESTRE - NOUVELLE VERSION AMÉLIORÉE
     * ==================================================================================================================================
     * 
     * OUVERTURE DU MODAL:
     * - Ouvre le modal de saisie des notes de trimestre
     * - Initialise la liste des élèves
     * - Prépare le formulaire pour le premier élève (ou celui qui était sélectionné)
     * 
     * @param evenement -L'événement collectif (trimestre/composition/examen) créé précédemment
     */
    ouvrirAttribuerTrimestre(evenement: EvenementCollectif): void {
        // Vérification: on doit avoir une classe sélectionnée
        if (!this.selectedClasse) return;
        
        // Récupérer la liste des élèves pour cette classe depuis le service partagé
        const eleves = this.schoolData.elevesPourClasse(this.selectedClasse);
        
        // Vérification: la classe doit contenir des élèves
        if (eleves.length === 0) return;
        
        // Initialiser l'état du trimestre avec:
        // - opened: true (modal ouvert)
        // - trimestreId: l'ID de l'événement
        // - eleveIndex: 0 (on commence par le premier élève)
        // - eleves: la liste de tous les élèves
        // - elevesEnregistres: set vide (aucun élève n'a encore cliqué sur "Enregistrer cet élève")
        this.currentTrimestreState = {
            opened: true,
            trimestreId: evenement.id,
            eleveIndex: 0,
            eleves: eleves,
            elevesEnregistres: new Set<number>()
        };
        
        // Préparer le formulaire pour le premier élève
        this.preparerFormulaireTrimestre(evenement);
        
        // Ouvrir le modal
        this.showAttribuerTrimestreModal = true;
    }

    /**
     * Variable qui stocke l'état actuel de la saisie des notes de trimestre
     * Contient: liste des élèves, index actuel, ID du trimestre, set des élèves débloqués
     */
    currentTrimestreState: AttributionTrimestreState | null = null;
    
    /**
     * ==================================================================================================================================
     * CACHE TEMPORAIRE - Conserve les notes en cours de saisie pour chaque élève
     * ==================================================================================================================================
     * 
     * Ce cache est nécessaire car:
     * - L'utilisateur peut naviguer librement entre les élèves
     * - On ne perd pas les notes déjà saisies (m même si on change d'élève)
     * - Le formulaire se remplit automatiquement quand on revient sur un élève
     * 
     * Format: { [eleveId]: LigneAttributionTrimestre[] }
     */
    private donneesTempTrimestre: DonneesTempTrimestre = {};
    
    /**
     * ==================================================================================================================================
     * RECHERCHE D'ÉLÈVES - Champ de recherche pour trouver rapidement un élève
     * ==================================================================================================================================
     */
    public rechercheEleveTrimestre = '';

    /**
     * ==================================================================================================================================
     * PRÉPARER LE FORMULAIRE POUR UN ÉLÈVE
     * ==================================================================================================================================
     * 
     * Cette méthode prépare le formulaire de saisie des notes pour l'élève actuellement sélectionné.
     * 
     * NOUVELLE LOGIQUE:
     * 1. On récupère l'ID de l'élève actuel (depuis eleveIndex)
     * 2. On vérifie si des notes temporaires existent déjà dans le cache pour cet élève
     * 3. Si oui → on les charge dans le formulaire (pour permettre modification)
     * 4. Si non → on crée un formulaire vide avec les matières du trimestre
     * 
     * @param evenement - L'événement collectif contenant les matières à évaluer
     */
    private preparerFormulaireTrimestre(evenement: EvenementCollectif): void {
        // Vérifier si on a un état de trimester valide
        if (!this.currentTrimestreState) return;
        
        // Récupérer l'élève actuellement sélectionné
        const eleve = this.currentTrimestreState.eleves[this.currentTrimestreState.eleveIndex];
        if (!eleve) return;
        
        // ==================================================================================================================================
         // NOUVELLE LOGIQUE: Vérifier d'abord dans le cache temporaire
         // ==================================================================================================================================
         if (this.donneesTempTrimestre[eleve.id]) {
             // Des notes existent déjà pour cet élève → les charger
             // Cela permet à l'utilisateur de reprendre là où il s'était arrêté
             this.formAttribuerTrimestre = this.donneesTempTrimestre[eleve.id];
         } else {
             // Première fois qu'on remplit pour cet élève → créer formulaire vide
             // Une ligne par matière cochée lors de la création du trimestre
             this.formAttribuerTrimestre = evenement.matieres.map(matiere => ({
                 matiere: matiere,              // Nom de la matière
                 moyenneClasse: 0,             // Moyenne de la classe (saisie par le prof)
                 noteCompo: 0,                  // Note de composition (/40)
                 moyenne: 0,                    // Moyenne ramenée sur 20
                 coefficient: 1,               // Coefficient de la matière
                 moyenneCoefficientee: 0,      // Moyenne × coefficient
                 appreciation: ''               // Appréciation (ex: "Bien", "Très Bien")
             }));
         }
    }

    /**
     * ==================================================================================================================================
     * SÉLECTIONNER UN ÉLÈVE (NOUVELLE MÉTHODE)
     * ==================================================================================================================================
     * 
     * Cette méthode est appelée quand l'utilisateur clique sur un élève dans la liste latérale.
     * 
     * ÉTAPES:
     * 1. Sauvegarder les notes temporaires de l'élève actuel AVANT de changer
     * 2. Trouver l'index de l'élève cliqué dans la liste
     * 3. Mettre à jour eleveIndex
     * 4. Charger les notes de l'élève cliqué (ou formulaire vide si nouvelles)
     * 
     * @param eleve - L'élève sélectionné
     */
    selectEleveForTrimestre(eleve: Eleve): void {
        // Vérifications de sécurité
        if (!this.currentTrimestreState) return;
        
        // ÉTAPE 1: Sauvegarder les notes temporaires de l'élève ACTUEL
        // Avant de changer d'élève, on met à jour le cache pour ne rien perdre
        this.sauvegarderNotesTemporaires();
        
        // ÉTAPE 2: Trouver l'index de l'élève cliqué
        const eleveIndex = this.currentTrimestreState.eleves.findIndex(e => e.id === eleve.id);
        if (eleveIndex === -1) return; // Élève non trouvé (ne devrait pas arriver)
        
        // ÉTAPE 3: Mettre à jour l'index de l'élève actuel
        this.currentTrimestreState.eleveIndex = eleveIndex;
        
        // ÉTAPE 4: Trouver l'événement (trimestre/composition) pour préloader le formulaire
        const trimestre = this.evenements.find(e => e.id === this.currentTrimestreState!.trimestreId);
        if (trimestre) {
            this.preparerFormulaireTrimestre(trimestre);
        }
    }
    
    /**
     * ==================================================================================================================================
     * SAUVEGARDER LES NOTES TEMPORAIRES
     * ==================================================================================================================================
     * 
     * Cette méthode sauvegarde les notes actuelles dans le cache temporaire.
     * Elle est appelée:
     * - Avant de changer d'élève
     * - Avant de fermer le modal
     * 
     * Cela permet de conserver les notes saisies même si on change d'élève.
     */
    private sauvegarderNotesTemporaires(): void {
        if (!this.currentTrimestreState) return;
        
        const eleve = this.currentTrimestreState.eleves[this.currentTrimestreState.eleveIndex];
        if (!eleve) return;
        
        // Sauvegarder les notes actuelles dans le cache avec l'ID de l'élève comme clé
        this.donneesTempTrimestre[eleve.id] = [...this.formAttribuerTrimestre];
    }
    
    /**
     * ==================================================================================================================================
     * OBTENIR L'ÉLÈVE ACTUELLEMENT SÉLECTIONNÉ
     * ==================================================================================================================================
     * 
     * @returns L'élève actuellement sélectionné dans le formulaire de saisie
     */
    getEleveActuel(): Eleve | null {
        if (!this.currentTrimestreState) return null;
        return this.currentTrimestreState.eleves[this.currentTrimestreState.eleveIndex] || null;
    }
    
    /**
     * ==================================================================================================================================
     * OBTENIR LA LISTE DES ÉLÈVES FILTRÉS PAR RECHERCHE
     * ==================================================================================================================================
     * 
     * Cette méthode filtre la liste des élèves en fonction du champ de recherche.
     * Elle est utilisée pour l'affichage dans le panneau latéral.
     * 
     * @returns Liste des élèves correspondant à la recherche
     */
    get elevesFiltresTrimestre(): Eleve[] {
        if (!this.currentTrimestreState) return [];
        
        // Pas de recherche → retourner tous les élèves
        if (!this.rechercheEleveTrimestre) return this.currentTrimestreState.eleves;
        
        // Filtrer par nom ou prénom
        const terme = this.rechercheEleveTrimestre.toLowerCase();
        return this.currentTrimestreState.eleves.filter(eleve => 
            eleve.prenom.toLowerCase().includes(terme) || 
            eleve.nom.toLowerCase().includes(terme)
        );
    }
    
/**
     * ==================================================================================================================================
     * VÉRIFIER SI UN ÉLÈVE A DES NOTES TEMPORAIRES
     * ==================================================================================================================================
     * 
     * @param eleveId - ID de l'élève
     * @returns true si l'élève a des notes temporaires sauvegardées (en cours de saisie)
     */
    aDesNotesTemporaires(eleveId: number): boolean {
        return !!this.donneesTempTrimestre[eleveId];
    }
    
    /**
     * ==================================================================================================================================
     * VÉRIFIER SI UN ÉLÈVE A SES NOTES ENREGISTRÉES (a cliqué sur "Enregistrer cet élève")
     * ==================================================================================================================================
     * 
     * @param eleveId - ID de l'élève
     * @returns true si l'élève a cliqué sur "Enregistrer cet élève"
     */
    aSesNotesEnregistrees(eleveId: number): boolean {
        return this.currentTrimestreState?.elevesEnregistres.has(eleveId) ?? false;
    }
    
    /**
     * ==================================================================================================================================
     * ENREGISTRER LES NOTES DE L'ÉLÈVE ACTUEL
     * ==================================================================================================================================
     * 
     * Cette méthode enregistre les notes de l'élève actuellement sélectionné.
     * Elle est appelée quand on clique sur "Enregistrer cet élève".
     * 
     * ÉTAPES:
     * 1. Sauvegarder dans le cache temporaire
     * 2. Marquer l'élève comme Ayant Enregistré (a cliqué sur le bouton)
     * 3. Passer à l'élève suivant automatique
     */
    enregistrerNotesEleveActuel(): void {
        if (!this.currentTrimestreState) return;
        
        // Sauvegarder les notes dans le cache temporaire
        this.sauvegarderNotesTemporaires();
        
        // Marquer l'élève comme thérapeut (ayant des notes enregistrées)
        const eleve = this.getEleveActuel();
        if (eleve) {
            this.currentTrimestreState.elevesEnregistres.add(eleve.id);
        }
        
        // Passer automatiquement à l'élève suivant (si disponible)
        const indexSuivant = this.currentTrimestreState.eleveIndex + 1;
        if (indexSuivant < this.currentTrimestreState.eleves.length) {
            this.currentTrimestreState.eleveIndex = indexSuivant;
            const trimestre = this.evenements.find(e => e.id === this.currentTrimestreState!.trimestreId);
            if (trimestre) {
                this.preparerFormulaireTrimestre(trimestre);
            }
        }
    }
    
    /**
     * ==================================================================================================================================
     * ENREGISTRER TOUS LES ÉLÈVES
     * ==================================================================================================================================
     * 
     * Cette méthode est appelée quand on clique sur "Enregistrer tous les élèves".
     * Elle enregistre les notes de TOUS les élèves qui ont des notes temporaires.
     * 
     * ÉTAPES:
     * 1. D'abord sauvegarder les notes de l'élève actuel (si pas encore fait)
     * 2. Pour chaque élève dans le cache temporaire:
     *    - Enregistrer définitivement les notes dans le store
     * 3. Vider le cache temporaire
     * 4. Fermer le modal
     */
    enregistrerTousLesEleves(): void {
        if (!this.currentTrimestreState) return;
        
        // ÉTAPE 1: Sauvegarder d'abord les notes de l'élève actuel
        this.sauvegarderNotesTemporaires();
        
        // ÉTAPE 2: Enregistrer définitivement chaque élève qui a des notes
        for (const eleve of this.currentTrimestreState.eleves) {
            // Vérifier si cet élève a des notes temporaires
            const notesTemp = this.donneesTempTrimestre[eleve.id];
            if (!notesTemp) continue; // Pas de notes pour cet élève
            
            // Récupérer ou créer le tableau de notes existant
            let notesTrimestre = this.notesTrimestreStore.get(eleve.id) || [];
            
            // Ajouter chaque note de chaque matière
            notesTemp.forEach(ligne => {
                notesTrimestre.push({
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
                });
            });
            
            // Sauvegarder dans le store permanent
            this.notesTrimestreStore.set(eleve.id, notesTrimestre);
        }
        
        // ÉTAPE 3: Vider le cache temporaire
        this.donneesTempTrimestre = {};
        
        // ÉTAPE 4: Fermer le modal
        this.fermerAttribuerTrimestreModal();
    }
    
    /**
     * ==================================================================================================================================
     * VÉRIFIER SI TOUS LES ÉLÈVES ONT LEURS NOTES ENREGISTRÉES
     * ==================================================================================================================================
     * 
     * @returns true si tous les élèves ont cliqué sur "Enregistrer cet élève"
     * Cette information est utilisée pour activer/désactiver le bouton "Enregistrer tous les élèves"
     */
    get tousLesElevesEnregistres(): boolean {
        if (!this.currentTrimestreState) return false;
        
        // Vérifier que chaque élève a cliqué sur "Enregistrer cet élève"
        return this.currentTrimestreState.elevesEnregistres.size === this.currentTrimestreState.eleves.length;
    }
    
    /**
     * ==================================================================================================================================
     * OBTENIR LE NOMBRE D'ÉLÈVES AYANT CLICQUÉ SUR "ENREGISTRER CET ÉLÈVE"
     * ==================================================================================================================================
     * 
     * @returns Nombre d'élèves ayant explicitement enregistré leurs notes
     */
    get nbElevesEnregistres(): number {
        if (!this.currentTrimestreState) return 0;
        
        return this.currentTrimestreState.elevesEnregistres.size;
    }
    
/**
     * ==================================================================================================================================
     * PASSER À L'ÉLÈVE SUIVANT (méthode conservée pour compatibilité)
     * ==================================================================================================================================
     * 
     * Cette méthode permet de naviguer vers l'élève suivant.
     * Elle sauvegarde les notes temporaires mais NE marque PAS l'élève comme enregistré.
     * L'utilisateur doit clicker explicitement sur "Enregistrer cet élève".
     */
    siguienteEleveTrimestre(): void {
        if (!this.currentTrimestreState) return;
        
        // Sauvegarder les notes temporaires de l'élève actuel (sans marquer comme enregistré)
        this.sauvegarderNotesTemporaires();
        
        // Passer à l'élève suivant
        this.currentTrimestreState.eleveIndex++;
        
        // Si on a fini tous les élèves, fermer le modal
        if (this.currentTrimestreState.eleveIndex >= this.currentTrimestreState.eleves.length) {
            this.fermerAttribuerTrimestreModal();
            return;
        }
        
        // Préparer le formulaire pour l'élève suivant
        const trimestre = this.evenements.find(e => e.id === this.currentTrimestreState!.trimestreId);
        if (trimestre) {
            this.preparerFormulaireTrimestre(trimestre);
        }
    }

    /**
     * ==================================================================================================================================
     * FERMER LE MODAL D'ATTRIBUTION TRIMESTRE
     * ==================================================================================================================================
     * 
     * Cette méthode ferme le modal et réinitialise toutes les variables liées à la saisie.
     * Elle est appelée:
     * - Quand on clique sur "Annuler"
     * - Quand on clique sur "X"
     * - Quand on clique sur outside du modal
     */
    fermerAttribuerTrimestreModal(): void {
        // Fermer le modal
        this.showAttribuerTrimestreModal = false;
        
        // Réinitialiser l'état du trimestre
        this.currentTrimestreState = null;
        
        // Vider le formulaire
        this.formAttribuerTrimestre = [];
        
        // Vider aussi le cache temporaire pour libérer de la mémoire
        this.donneesTempTrimestre = {};
        
        // Réinitialiser la recherche
        this.rechercheEleveTrimestre = '';
    }

    calculerMoyenneCoefficientee(index: number): void {
        const ligne = this.formAttribuerTrimestre[index];
        ligne.moyenneCoefficientee = ligne.moyenne * ligne.coefficient;
    }

    // ═══════════════ RETOUR ═══════════════
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