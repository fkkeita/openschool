import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { SchoolDataService, Cycle, Annee, Eleve } from '../../core/services/school-data.service';
import { BulletinPdfComponent } from '../../core/components/bulletin-pdf/bulletin-pdf.component';

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
    private sanitizer = inject(DomSanitizer);
    
    // Composant de génération PDF bulletin
    public bulletinPdf = new BulletinPdfComponent();

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
    
    /**
     * ==================================================================================================================================
     * POPUP CONSULTATION NOTES ÉLÈVE (NOUVEAU DESIGN)
     * ==================================================================================================================================
     * 
     * Ce popup s'affiche quand on clique sur "Voir les notes" après sélection d'une classe.
     * Il comporte:
     * - Un panneau latéral gauche avec la liste des élèves + barre de recherche
     * - Une partie droite avec le tableau des moyennes des trimestre/compositions
     * 
     * Propriétés:
     * -elevesConsultation: liste des élèves de la classe sélectionnée
     * -eleveActuelConsultation: élève actuellement sélectionné dans le panneau latéral
     * -rechercheEleveConsultation: texte de recherche pour filtrer les élèves
     * -vueActiveConsultation: 'devoirs' | 'trimestres' - permet de filtrer l'affichage
     * -moisConsultation: filtre par mois (null = tous les mois)
     * -fichiersUploades: Map des fichiers uploadés par élève et devoir
     */
    public showConsultationNotesModal = false;
    public elevesConsultation: Eleve[] = [];
    public eleveActuelConsultation: Eleve | null = null;
    public rechercheEleveConsultation = '';
    public classeConsultation = '';
    public vueActiveConsultation: 'devoirs' | 'trimestres' = 'devoirs';
    public moisConsultation: string | null = null;
    public fichiersUploades: Map<string, string> = new Map();

    /**
     * ==================================================================================================================================
     * POPUP DE CONFIRMATION ENREGISTREMENT TRIMESTRE
     * ==================================================================================================================================
     * 
     * Ce popup s'affiche quand l'utilisateur clique sur "Enregistrer l'élève [Prénom Nom]".
     * Il affiche:
     * - Le résumé des notes saisies pour chaque matière
     * - La moyenne du trimestre pour l'élève
     * - Un bouton pour confirmer (enregistre définitivement)
     * - Un bouton pour annuler (pour modifier)
     * 
     * Après confirmation, les notes sont verrouillées pour cet élève.
     */
    public showConfirmationTrimestreModal = false;

    /**
     * ==================================================================================================================================
     * NOTES VERRROUILLÉES PAR ÉLÈVE
     * ==================================================================================================================================
     * 
     * Set qui stocke les IDs des élèves dont les notes de trimestre ont été confirmées.
     * Format de la clé: "{trimestreId}_{eleveId}"
     * 
     * Une fois confirmé, on ne peut plus modifier les notes.
     */
    public notesTrimestreVerrouilles: Set<string> = new Set();
    
    /**
     * Mode consultation pour les notes verrouillées.
     * Quand true, l'utilisateur peut seulement consulter les notes sans pouvoir les modifier.
     */
    public modeConsultationTrimestre = false;
    
    /**
     * ==================================================================================================================================
     * APERÇU DU BULLETIN PDF
     * ==================================================================================================================================
     * Contient les données PDF en base64 pour l'aperçu intégré.
     */
    public pdfApercuUrl: string | null = null;
    public pdfApercuSafeUrl: SafeResourceUrl | null = null;
    public apercuFichierSafeUrl: SafeResourceUrl | null = null;
    public showApercuBulletin = false;
    public apercuFichierUrl: string | null = null;
    public apercuFichierType: 'pdf' | 'image' | null = null;
    public showApercuFichier = false;
    public showApercuRecu = false;
    public apercuRecuSafeUrl: SafeResourceUrl | null = null;

    // Stores de notes
    public notesStore: Map<number, NoteEntry[]> = new Map();
    public notesTrimestreStore: Map<number, NoteTrimestre[]> = new Map();
    public evenements: EvenementCollectif[] = [];
    
    // Classement global
    public showClassementGlobal = false;
    public classementGlobal: { eleve: Eleve; moyenne: number; rang: number }[] = [];
    public premiereMoyenneClasse = 0;

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
        this.chargerNotesVerrouilleesLocalStorage();
        this.chargerEvenementsLocalStorage();
        this.chargerFichiersUploadesLocalStorage();
        this.chargerNotesDevoirsLocalStorage();
    }
    
    /**
     * ==================================================================================================================================
     * SAUVEGARDER LES NOTES DE DEVOIRS DANS LOCALSTORAGE
     * ==================================================================================================================================
     */
    sauvegarderNotesDevoirsLocalStorage(): void {
        try {
            const data = Array.from(this.notesStore.entries());
            localStorage.setItem('notes_devoirs', JSON.stringify(data));
        } catch (error) {
            console.error('Erreur sauvegarde notes:', error);
        }
    }
    
    /**
     * ==================================================================================================================================
     * CHARGER LES NOTES DE DEVOIRS DEPUIS LOCALSTORAGE
     * ==================================================================================================================================
     */
    private chargerNotesDevoirsLocalStorage(): void {
        try {
            const data = localStorage.getItem('notes_devoirs');
            if (data) {
                this.notesStore = new Map(JSON.parse(data));
            }
        } catch (error) {
            console.error('Erreur chargement notes:', error);
        }
    }
    
    /**
     * ==================================================================================================================================
     * SAUVEGARDER LES ÉVÉNEMENTS (TRIMESTRES/COMPOSITIONS) DANS LOCALSTORAGE
     * ==================================================================================================================================
     * Sauvegarde tous les événements créés dans le localStorage pour persistance.
     */
    private sauvegarderEvenementsLocalStorage(): void {
        try {
            localStorage.setItem('evenements_scolaires', JSON.stringify(this.evenements));
        } catch (error) {
            console.error('Erreur sauvegarde événements:', error);
        }
    }
    
    /**
     * ==================================================================================================================================
     * CHARGER LES ÉVÉNEMENTS DEPUIS LOCALSTORAGE
     * ==================================================================================================================================
     * Charge les événements au démarrage de l'application.
     */
    private chargerEvenementsLocalStorage(): void {
        try {
            const data = localStorage.getItem('evenements_scolaires');
            if (data) {
                this.evenements = JSON.parse(data);
            }
        } catch (error) {
            console.error('Erreur chargement événements:', error);
            this.evenements = [];
        }
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

    /**
     * ==================================================================================================================================
     * OBTENIR LES MATIÈRES D'UNE CLASSE (nom + coefficient)
     * ==================================================================================================================================
     * 
     * Cette méthode retourne les matières enseignées dans une classe donnée,
     * avec她们的 coefficient.
     * 
     * Format de retour: { matiere: string; coefficient: number }[]
     * 
     * @param classe - Le nom de la classe
     * @returns Tableau de {matiere, coefficient}
     */
    getMatieresAvecCoefficient(classe: string): { matiere: string; coefficient: number }[] {
        if (!classe) return [];

        // Appel au service pour récupérer les matières de cette classe
        const matieres = this.schoolData.matieresPourClasse(classe);

        // Retourner un tableau avec le nom et le coefficient
        return matieres.map(m => ({
            matiere: m.matiere,
            coefficient: this.getCoefficientMatiere(m.matiere, classe)
        }));
    }

    /**
     * ==================================================================================================================================
     * OBTENIR LE COEFFICIENT D'UNE MATIÈRE
     * ==================================================================================================================================
     * 
     * Cette méthode retourne le coefficient d'une matière spécifique.
     * Elle cherche d'abord dans les données du service, sinon retourne 1 par défaut.
     * 
     * @param matiere - Le nom de la matière
     * @returns Le coefficient (défaut: 1)
     */
    getCoefficientMatiere(matiere: string, classe: string): number {
        // Chercher dans les matières du service
        const matiereData = this.schoolData.matieres.find(m => m.nom === matiere);
        if (matiereData) {
            return matiereData.coefficient;
        }

        // Par défaut, retourner 1
        return 1;
    }

    /**
     * ==================================================================================================================================
     * OBTENIR LES MATIÈRES SIMPLES (JUSQU LE NOM)
     * ==================================================================================================================================
     * 
     * Alias pour compatibilité avec le code existant.
     * 
     * @param classe - Le nom de la classe
     * @returns Tableau des noms de matières
     */
    getMatieresClasse(classe: string): string[] {
        const matieres = this.getMatieresAvecCoefficient(classe);
        return matieres.map(m => m.matiere);
    }

    getClassesAnnee(annee: Annee | null): string[] {
        return annee ? this.schoolData.classesPourAnnee(annee.nom) : [];
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
        this.classeConsultation = classe;
        this.elevesConsultation = this.schoolData.elevesPourClasse(classe);
        
        // Sélectionner le premier élève par défaut
        if (this.elevesConsultation.length > 0) {
            this.eleveActuelConsultation = this.elevesConsultation[0];
        }
        
        // Par défaut, afficher les devoirs/interrogations
        this.vueActiveConsultation = 'devoirs';
        
        // Ouvrir le nouveau popup de consultation
        this.showConsultationNotesModal = true;
    }
    
    /**
     * ==================================================================================================================================
     * FERMER LE POPUP DE CONSULTATION NOTES
     * ==================================================================================================================================
     * Ferme le popup de consultation des notes et réinitialise les propriétés.
     */
    fermerConsultationNotes(): void {
        this.showConsultationNotesModal = false;
        this.elevesConsultation = [];
        this.eleveActuelConsultation = null;
        this.rechercheEleveConsultation = '';
        this.classeConsultation = '';
    }
    
    /**
     * ==================================================================================================================================
     * SÉLECTIONNER UN ÉLÈVE DANS LE POPUP DE CONSULTATION
     * ==================================================================================================================================
     * @param eleve - L'élève à sélectionner
     */
    selectEleveConsultation(eleve: Eleve): void {
        this.eleveActuelConsultation = eleve;
    }
    
    /**
     * ==================================================================================================================================
     * OBTENIR LA LISTE DES ÉLÈVES FILTRÉS POUR LA CONSULTATION
     * ==================================================================================================================================
     * Retourne la liste des élèves filtrée par le champ de recherche.
     */
    get elevesFiltresConsultation(): Eleve[] {
        if (!this.rechercheEleveConsultation) {
            return this.elevesConsultation;
        }
        const terme = this.rechercheEleveConsultation.toLowerCase();
        return this.elevesConsultation.filter(eleve =>
            eleve.prenom.toLowerCase().includes(terme) ||
            eleve.nom.toLowerCase().includes(terme)
        );
    }
    
    /**
     * ==================================================================================================================================
     * OBTENIR LES NOTES D'UN ÉLÈVE POUR TOUS LES TRIMESTRES/COMPOSITIONS
     * ==================================================================================================================================
     * Retourne les données pour le tableau des moyennes.
     * Ces données proviennent du localStorage.
     * 
     * @param eleveId - ID de l'élève
     * @returns Tableau avec les informations par trimestre/composition (filtré par mois si sélectionné)
     */
    getDonneesTrimestresEleve(eleveId: number): any[] {
        const result: any[] = [];
        
        // Parcourir tous les événements (trimestres/compositions) créés
        for (const evt of this.evenements) {
            // Vérifier si des notes existent pour cet événement dans le localStorage
            const cleStorage = `notes_trimestre_${evt.id}_${eleveId}`;
            const data = localStorage.getItem(cleStorage);
            
            // Filtrer par mois si un mois est sélectionné
            if (this.moisConsultation && evt.date && !evt.date.startsWith(this.moisConsultation)) {
                continue;
            }
            
            if (data) {
                try {
                    const notes: any[] = JSON.parse(data);
                    
                    // Calculer la moyenne générale pour ce trimestre
                    let totalCoef = 0;
                    let totalMoyCoef = 0;
                    
                    for (const note of notes) {
                        totalCoef += note.coefficient || 0;
                        totalMoyCoef += (note.moyenneCoefficientee || 0);
                    }
                    
                    const moyenne = totalCoef > 0 ? totalMoyCoef / totalCoef : 0;
                    
                    result.push({
                        id: evt.id,
                        titre: evt.titre,
                        type: evt.type,
                        date: evt.date,
                        matieres: evt.matieres,
                        moyenne: Math.round(moyenne * 100) / 100,
                        coefficients: totalCoef
                    });
                } catch (e) {
                    console.error('Erreur lecture notes:', e);
                }
            }
        }
        
        return result;
    }
    
    /**
     * ==================================================================================================================================
     * OBTENIR LES NOTES DEVOIRS/INTERROGATIONS D'UN ÉLÈVE
     * ==================================================================================================================================
     * Retourne les notes simples (devoirs, interros) pour un élève.
     * 
     * @param eleveId - ID de l'élève
     * @returns Tableau avec les notes de devoirs/interrogations (filtrées par mois si sélectionné)
     */
    getDonneesDevoirsEleve(eleveId: number): any[] {
        const notes = this.notesStore.get(eleveId) || [];
        
        // Filtrer par mois si un mois est sélectionné
        if (this.moisConsultation) {
            const mois = this.moisConsultation;
            return notes.filter(note => note.date && note.date.startsWith(mois));
        }
        
        return notes;
    }
    
    /**
     * ==================================================================================================================================
     * CHANGER LE TYPE DE VUE DANS LE POPUP DE CONSULTATION
     * ==================================================================================================================================
     * @param vue - 'devoirs' ou 'trimestres'
     */
    changerVueConsultation(vue: 'devoirs' | 'trimestres'): void {
        this.vueActiveConsultation = vue;
    }
    
    /**
     * ==================================================================================================================================
     * CHANGER LE MOIS DE FILTRE DANS LE POPUP DE CONSULTATION
     * ==================================================================================================================================
     * @param mois - Mois au format 'YYYY-MM' ou null pour tous les mois
     */
    changerMoisConsultation(mois: string | null): void {
        this.moisConsultation = mois;
    }
    
    /**
     * ==================================================================================================================================
     * OBTENIR LA LISTE DES MOIS DISPONIBLES POUR LA CONSULTATION
     * ==================================================================================================================================
     * Retourne la liste des mois pour lesquels l'élève a des notes.
     */
    getMoisDisponiblesConsultation(): string[] {
        if (!this.eleveActuelConsultation) return [];
        
        const moisSet = new Set<string>();
        const notes = this.notesStore.get(this.eleveActuelConsultation.id) || [];
        
        for (const note of notes) {
            if (note.date) {
                const mois = note.date.substring(0, 7);
                moisSet.add(mois);
            }
        }
        
        // Ajouter aussi les mois des trimestres
        const donneesTrimestres = this.getDonneesTrimestresEleve(this.eleveActuelConsultation.id);
        for (const trim of donneesTrimestres) {
            if (trim.date) {
                const mois = trim.date.substring(0, 7);
                moisSet.add(mois);
            }
        }
        
        return Array.from(moisSet).sort().reverse();
    }
    
    /**
     * ==================================================================================================================================
     * CHARGER LES FICHIERS UPLOADÉS DEPUIS LOCALSTORAGE
     * ==================================================================================================================================
     * Charge les fichiers uploadés pour les devoirs/interrogations.
     */
    private chargerFichiersUploadesLocalStorage(): void {
        try {
            const data = localStorage.getItem('fichiers_uploades');
            if (data) {
                this.fichiersUploades = new Map(JSON.parse(data));
            }
        } catch (error) {
            console.error('Erreur chargement fichiers:', error);
        }
    }
    
    /**
     * ==================================================================================================================================
     * SAUVEGARDER UN FICHIER UPLOADÉ DANS LOCALSTORAGE
     * ==================================================================================================================================
     * @param eleveId - ID de l'élève
     * @param devoirId - ID du devoir
     * @param contenu - Contenu du fichier en base64
     */
    sauvegarderFichierUpload(eleveId: number, devoirId: number, contenu: string): void {
        const cle = `${eleveId}_${devoirId}`;
        this.fichiersUploades.set(cle, contenu);
        
        try {
            localStorage.setItem('fichiers_uploades', JSON.stringify(Array.from(this.fichiersUploades.entries())));
        } catch (error) {
            console.error('Erreur sauvegarde fichier:', error);
        }
    }
    
    /**
     * ==================================================================================================================================
     * OBTENIR LE FICHIER UPLOADÉ D'UN ÉLÈVE POUR UN DEVOIR
     * ==================================================================================================================================
     * @param eleveId - ID de l'élève
     * @param devoirId - ID du devoir
     * @returns Contenu du fichier en base64 ou null
     */
    getFichierUpload(eleveId: number, devoirId: number): string | null {
        const cle = `${eleveId}_${devoirId}`;
        return this.fichiersUploades.get(cle) || null;
    }
    
    /**
     * ==================================================================================================================================
     * CALCULER L'APPRÉCIATION POUR UN DEVOIR/INTERROGATION
     * ==================================================================================================================================
     * Même règle que pour les trimestres.
     * 
     * @param note - Note sur 20
     * @returns Appréciation correspondante
     */
    determinerAppreciationDevoir(note: number): string {
        if (note < 4) return 'Nul';
        if (note < 10) return 'Insuffisant';
        if (note < 12) return 'Passable';
        if (note < 14) return 'Assez-Bien';
        if (note < 16) return 'Bien';
        if (note < 18) return 'Très Bien';
        return 'Excellent';
    }
    
    /**
     * ==================================================================================================================================
     * OBTENIR LE NOM DU MOIS POUR L'AFFICHAGE
     * ==================================================================================================================================
     * @param mois - Mois au format 'YYYY-MM'
     * @returns Nom du mois formaté (ex: 'Janvier 2025')
     */
    getNomMois(mois: string): string {
        const [annee, month] = mois.split('-');
        const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        return `${moisNoms[parseInt(month, 10) - 1]} ${annee}`;
    }
    
    /**
     * ==================================================================================================================================
     * GÉRER LE CHANGEMENT DE FICHIER UPLOADÉ
     * ==================================================================================================================================
     * @param event - Événement de change de l'input file
     * @param eleveId - ID de l'élève
     * @param devoirId - ID du devoir
     */
    onFichierChange(event: any, eleveId: number, devoirId: number): void {
        const fichier = event.target.files[0];
        if (!fichier) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            this.sauvegarderFichierUpload(eleveId, devoirId, base64);
        };
        reader.readAsDataURL(fichier);
    }
    
    /**
     * ==================================================================================================================================
     * TÉLÉCHARGER UN FICHIER UPLOADÉ
     * ==================================================================================================================================
     * @param note - Note du devoir
     * @param eleve - Élève
     */
    telechargerFichier(note: any, eleve: Eleve | null): void {
        if (!eleve) return;
        
        const contenu = this.getFichierUpload(eleve.id, note.id);
        if (!contenu) return;
        
        this.telechargerFichierDirect(contenu);
    }
    
    telechargerFichierDirect(url: string | null): void {
        if (!url) return;
        
        const link = document.createElement('a');
        link.href = url;
        
        const extension = url.includes('data:application/pdf') ? '.pdf' : '.jpg';
        link.download = `piece_jointe${extension}`;
        link.click();
    }
    
    telechargerOuGenererRecu(note: any, eleve: Eleve | null): void {
        if (!eleve) return;
        
        const fichierKey = this.getDevoirIdFromTitre(note.titre, note.type);
        const contenu = this.getFichierUpload(eleve.id, fichierKey);
        if (contenu) {
            this.telechargerFichierDirect(contenu);
            return;
        }
        
        this.genererEtTelechargerRecuPdf(note, eleve);
    }
    
    async genererEtTelechargerRecuPdf(note: any, eleve: Eleve): Promise<void> {
        try {
            const jsPDF = await import('jspdf');
            const doc = new jsPDF.jsPDF();
            
            const appreciation = this.determinerAppreciationDevoir(note.note);
            const dateNote = new Date(note.date).toLocaleDateString('fr-FR');
            
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Reçu de Note', 105, 25, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            doc.text('École:', 20, 45);
            doc.text('OpenSchool', 60, 45);
            
            doc.text('Année scolaire:', 20, 55);
            doc.text('2025-2026', 60, 55);
            
            doc.line(20, 62, 190, 62);
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Informations de la note', 105, 75, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            doc.text('Élève:', 20, 90);
            doc.text(`${eleve.nom} ${eleve.prenom || ''}`, 60, 90);
            
            doc.text('Matière:', 20, 100);
            doc.text(note.matiere || '', 60, 100);
            
            doc.text('Type:', 20, 110);
            doc.text(note.type || '', 60, 110);
            
            doc.text('Titre:', 20, 120);
            doc.text(note.titre || '', 60, 120);
            
            doc.text('Date:', 20, 130);
            doc.text(dateNote, 60, 130);
            
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Note:', 20, 150);
            doc.text(`${note.note}/20`, 60, 150);
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Appréciation:', 20, 165);
            doc.setTextColor(99, 102, 241);
            doc.text(appreciation, 70, 165);
            doc.setTextColor(0, 0, 0);
            
            doc.line(20, 175, 190, 175);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text('Document généré automatiquement par OpenSchool', 105, 185, { align: 'center' });
            
            doc.save(`${eleve.nom}_${note.titre}_${note.date}.pdf`);
        } catch (error) {
            console.error('Erreur génération PDF:', error);
            alert('Erreur lors de la génération du PDF');
        }
    }
    
    /**
     * ==================================================================================================================================
     * ENVOYER LA NOTE AU PARENT PAR WHATSAPP
     * ==================================================================================================================================
     * @param note - Note du devoir
     * @param eleve - Élève
     */
    async envoyerNoteParent(note: any, eleve: Eleve | null): Promise<void> {
        if (!eleve) return;
        
        const telephoneParent = (eleve as any).telephoneParent || (eleve as any).parent || (eleve as any).telephone;
        
        if (!telephoneParent) {
            alert('Numéro WhatsApp du parent non disponible pour cet élève');
            return;
        }
        
        const appreciation = this.determinerAppreciationDevoir(note.note);
        const message = `Bonjour, Voici la note de ${eleve.nom} ${eleve.prenom || ''} pour le devoir de ${note.matiere} "${note.titre}" : ${note.note}/20 - Appréciation: ${appreciation}. OpenSchool`;
        
        let numeroClean = telephoneParent.replace(/[^\d\+]/g, '');
        let numeroWhatsApp = numeroClean;
        if (!numeroClean.startsWith('+')) {
            numeroWhatsApp = '+223' + numeroClean.replace(/^0+/, '');
        }
        numeroWhatsApp = numeroWhatsApp.replace(/^\+223223/, '+223');
        
        const url = `https://wa.me/${numeroWhatsApp.replace('+', '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }
    
    /**
     * ==================================================================================================================================
     * VOIR LE FICHIER DANS UN POPUP
     * ==================================================================================================================================
     * @param note - Note du devoir
     * @param eleve - Élève
     */
    voirFichierDevoir(note: any, eleve: Eleve | null): void {
        if (!eleve) return;
        
        this.genererRecuPdfPourPopup(note, eleve);
    }
    
    async genererRecuPdfPourPopup(note: any, eleve: Eleve): Promise<void> {
        try {
            const jsPDF = await import('jspdf');
            const doc = new jsPDF.jsPDF();
            
            const appreciation = this.determinerAppreciationDevoir(note.note);
            const dateNote = new Date(note.date).toLocaleDateString('fr-FR');
            
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Reçu de Note', 105, 25, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            doc.text('École:', 20, 45);
            doc.text('OpenSchool', 60, 45);
            
            doc.text('Année scolaire:', 20, 55);
            doc.text('2025-2026', 60, 55);
            
            doc.line(20, 62, 190, 62);
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Informations de la note', 105, 75, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            doc.text('Élève:', 20, 90);
            doc.text(`${eleve.nom} ${eleve.prenom || ''}`, 60, 90);
            
            doc.text('Matière:', 20, 100);
            doc.text(note.matiere || '', 60, 100);
            
            doc.text('Type:', 20, 110);
            doc.text(note.type || '', 60, 110);
            
            doc.text('Titre:', 20, 120);
            doc.text(note.titre || '', 60, 120);
            
            doc.text('Date:', 20, 130);
            doc.text(dateNote, 60, 130);
            
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Note:', 20, 150);
            doc.text(`${note.note}/20`, 60, 150);
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Appréciation:', 20, 165);
            doc.setTextColor(99, 102, 241);
            doc.text(appreciation, 70, 165);
            doc.setTextColor(0, 0, 0);
            
            doc.line(20, 175, 190, 175);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text('Document généré automatiquement par OpenSchool', 105, 185, { align: 'center' });
            
            const pdfOutput = doc.output('datauristring');
            this.apercuFichierUrl = pdfOutput;
            this.apercuRecuSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfOutput);
            this.showApercuRecu = true;
        } catch (error) {
            console.error('Erreur génération PDF:', error);
            alert('Erreur lors de la génération du PDF');
        }
    }
    
    fermerApercuRecu(): void {
        this.showApercuRecu = false;
        this.apercuRecuSafeUrl = null;
        this.apercuFichierUrl = null;
    }
    
    telechargerRecuDirect(): void {
        if (!this.apercuFichierUrl) return;
        const link = document.createElement('a');
        link.href = this.apercuFichierUrl;
        link.download = `recu_note.pdf`;
        link.click();
    }
    
    fermerApercuFichier(): void {
        this.showApercuFichier = false;
        this.apercuFichierUrl = null;
        this.apercuFichierSafeUrl = null;
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
        
        // Sauvegarder les événements dans localStorage pour persistance
        this.sauvegarderEvenementsLocalStorage();
        
        this.showCreateEvenementModal = false;
        this.ouvrirAttribuerTrimestre(evenement);
    }

    // ═══════════════ ATTRIBUTION NOTES SIMPLES ═══════════════
    ouvrirAttribuerNotes(type: string, titre: string, _evenementId?: number): void {
        this.showAttribuerNotesModal = { type, titre };
        const eleves = this.schoolData.elevesPourClasse(this.selectedClasse!);
        // Extraire l'ID du devoir depuis le titre ou utiliser une clé basée sur le type
        const fichierKey = this.getDevoirIdFromTitre(titre, type);
        
        this.formAttribuer = eleves.map(e => ({ 
            eleveId: e.id, 
            note: 0
        }));
    }
    
    getDevoirIdFromTitre(titre: string, type: string): number {
        let hash = 0;
        const str = titre + type;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    enregistrerAttribution(): void {
        if (!this.showAttribuerNotesModal) return;
        
        const notesSaisies = this.getNombreNotesSaisies();
        if (notesSaisies === 0) {
            alert('Veuillez saisir au moins une note');
            return;
        }
        
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
        this.sauvegarderNotesDevoirsLocalStorage();
        this.showAttribuerNotesModal = null;
    }
    
    getNombreNotesSaisies(): number {
        return this.formAttribuer.filter(att => att.note >= 0).length;
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

        const trimestreId = this.currentTrimestreState.trimestreId;

        // ==================================================================================================================================
        // VÉRIFIER SI LES NOTES SONT VERRROUILLÉES
        // ==================================================================================================================================
        const sontVerrouillees = this.sontNotesVerrouillees(eleve.id, trimestreId);
        this.modeConsultationTrimestre = sontVerrouillees;
        
        if (sontVerrouillees) {
            // Notes verrouillées → charger depuis localStorage pour consultation seule
            const notesVerrouillees = this.notesTrimestreStore.get(eleve.id);
            if (notesVerrouillees && notesVerrouillees.length > 0) {
                // Transformer les notes sauvegardées en format formulaire
                this.formAttribuerTrimestre = notesVerrouillees.map(n => ({
                    matiere: n.matiere,
                    moyenneClasse: n.moyenneClasse,
                    noteCompo: n.noteCompo,
                    moyenne: n.moyenne,
                    coefficient: n.coefficient,
                    moyenneCoefficientee: n.moyenneCoefficientee,
                    appreciation: n.appreciation
                }));
                return;
            }
        }

        // ==================================================================================================================================
        // Vérifier d'abord dans le cache temporaire
        // ==================================================================================================================================
        if (this.donneesTempTrimestre[eleve.id]) {
            this.formAttribuerTrimestre = this.donneesTempTrimestre[eleve.id];
        } else {
            this.formAttribuerTrimestre = evenement.matieres.map(matiere => ({
                matiere: matiere,
                moyenneClasse: 0,
                noteCompo: 0,
                moyenne: 0,
                coefficient: this.getCoefficientMatiere(matiere, this.selectedClasse || ''),
                moyenneCoefficientee: 0,
                appreciation: ''
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
     * OBTENIR LE TITRE DU TRIMESTRE ACTUEL
     * ==================================================================================================================================
     * 
     * @returns Le titre du trimestre/composition/examen actuel
     */
    getTitreTrimestre(): string {
        if (!this.currentTrimestreState) return '';
        const evenement = this.evenements.find(e => e.id === this.currentTrimestreState!.trimestreId);
        return evenement?.titre || '';
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

            // Sauvegarder dans le store permanent (mémoire)
            this.notesTrimestreStore.set(eleve.id, notesTrimestre);
            
            // Sauvegarder aussi dans localStorage
            const cleStorage = `notes_trimestre_${this.currentTrimestreState!.trimestreId}_${eleve.id}`;
            localStorage.setItem(cleStorage, JSON.stringify(notesTrimestre));
            
            // Marquer comme verrouillé
            const cleVerrouillage = this.getCleVerrouillage(eleve.id, this.currentTrimestreState!.trimestreId);
            this.notesTrimestreVerrouilles.add(cleVerrouillage);
        }

        // ÉTAPE 3: Vider le cache temporaire
        this.donneesTempTrimestre = {};

        // ÉTAPE 4: Calculer le classement global et afficher le popup
        this.calculerClassementGlobal();
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

    /**
     * ==================================================================================================================================
     * CALCULER LA MOYENNE/20
     * ==================================================================================================================================
     * 
     * Formule: Moyenne/20 = (Moyenne Classe/20 + Note/40) / 3
     * 
     * @param ligne - La ligne d'attribution contenant moyenneClasse et noteCompo
     * @returns La moyenne calculée sur 20
     */
    calculerMoyenne(ligne: LigneAttributionTrimestre): number {
        const moyClasse = ligne.moyenneClasse || 0;
        const noteCompo = ligne.noteCompo || 0;



        // Moyenne = (moyenneClasse + noteSur20) / 3
        const moyenne = (moyClasse + noteCompo) / 3;

        return Math.round(moyenne * 100) / 100;
    }

    /**
     * ==================================================================================================================================
     * CALCULER LA MOYENNE COEFFICIÉE
     * ==================================================================================================================================
     * 
     * Formule: Moyenne coefficiée = Moyenne/20 × Coefficient
     * 
     * @param ligne - La ligne d'attribution
     * @returns La moyenne coefficiée
     */
    calculerMoyenneCoefficientee(ligne: LigneAttributionTrimestre): number {
        const moyenne = this.calculerMoyenne(ligne);
        return Math.round(moyenne * ligne.coefficient * 100) / 100;
    }

    /**
     * ==================================================================================================================================
     * DÉTERMINER L'APPRÉCIATION AUTOMATIQUEMENT
     * ==================================================================================================================================
     * 
     * Tableau d'appréciation:
     * - "Nul" si Moyenne/20 = 0
     * - "Insuffisant" si Moyenne/20 <= 9
     * - "Passable" si Moyenne/20 <= 11
     * - "Assez-Bien" si Moyenne/20 <= 13
     * - "Bien" si Moyenne/20 <= 15
     * - "Très Bien" si Moyenne/20 <= 17
     * - "Excellent" si Moyenne/20 <= 20
     * 
     * @param ligne - La ligne d'attribution
     * @returns L'appréciation automatiquement déterminée
     */
    determinerAppreciation(ligne: LigneAttributionTrimestre): string {
        const moyenne = this.calculerMoyenne(ligne);
        
        if (moyenne < 4) return 'Nul';
        if (moyenne < 10) return 'Insuffisant';
        if (moyenne < 12) return 'Passable';
        if (moyenne < 14) return 'Assez-Bien';
        if (moyenne < 16) return 'Bien';
        if (moyenne < 18) return 'Très Bien';
        return 'Excellent';
    }
    
    getAppreciationTrimestre(moyenne: number): string {
        if (moyenne < 4) return 'Nul';
        if (moyenne < 10) return 'Insuffisant';
        if (moyenne < 12) return 'Passable';
        if (moyenne < 14) return 'Assez-Bien';
        if (moyenne < 16) return 'Bien';
        if (moyenne < 18) return 'Très Bien';
        return 'Excellent';
    }

    /**
     * ==================================================================================================================================
     * CALCULER LA MOYENNE GÉNÉRALE DU TRIMESTRE
     * ==================================================================================================================================
     * 
     * Formule: Somme des moyennes coefficiées / Somme des coefficients
     * 
     * @returns La moyenne générale du trimestre pour l'élève actuel
     */
    get moyenneGeneraleTrimestre(): number {
        if (!this.formAttribuerTrimestre || this.formAttribuerTrimestre.length === 0) return 0;

        let sommeMoyennesCoeff = 0;
        let sommeCoefficients = 0;

        for (const ligne of this.formAttribuerTrimestre) {
            const moyCoeff = this.calculerMoyenneCoefficientee(ligne);
            sommeMoyennesCoeff += moyCoeff;
            sommeCoefficients += ligne.coefficient;
        }

        if (sommeCoefficients === 0) return 0;

        return Math.round((sommeMoyennesCoeff / sommeCoefficients) * 100) / 100;
    }

    /**
     * ==================================================================================================================================
     * METTRE À JOUR LES CHAMPS AUTOMATIQUEMENT QUAND UN CHAMP CHANGE
     * ==================================================================================================================================
     * 
     * Cette méthode est appelée quand l'utilisateur change un valeur dans le formulaire.
     * Elle recalcule automatiquement:
     * - La moyenne/20
     * - La moyenne coefficiée
     * - L'appréciation
     * 
     * @param index - Index de la ligne dans le formulaire
     */
    miseAJourAutomatique(index: number): void {
        const ligne = this.formAttribuerTrimestre[index];
        if (!ligne) return;

        ligne.moyenne = this.calculerMoyenne(ligne);
        ligne.moyenneCoefficientee = this.calculerMoyenneCoefficientee(ligne);
        ligne.appreciation = this.determinerAppreciation(ligne);
    }

    /**
     * ==================================================================================================================================
     * VÉRIFIER SI LES NOTES D'UN ÉLÈVE SONT VERRROUILLÉES
     * ==================================================================================================================================
     * 
     * @param eleveId - ID de l'élève
     * @param trimestreId - ID du trimestre
     * @returns true si les notes sont verrouillées
     */
    public sontNotesVerrouillees(eleveId: number, trimestreId: number): boolean {
        const cle = `${trimestreId}_${eleveId}`;
        return this.notesTrimestreVerrouilles.has(cle);
    }

    /**
     * ==================================================================================================================================
     * OBTENIR LA CLÉ DE VERRROUILLAGE
     * ==================================================================================================================================
     * Format: "{trimestreId}_{eleveId}"
     */
private getCleVerrouillage(eleveId: number, trimestreId: number): string {
        return `${trimestreId}_${eleveId}`;
    }

    fermerConfirmationTrimestre(): void {
        this.showConfirmationTrimestreModal = false;
    }

    ouvrirConfirmationTrimestre(): void {
        this.showConfirmationTrimestreModal = true;
    }

    confirmerEnregistrementTrimestre(): void {
        if (!this.currentTrimestreState) return;

        const eleve = this.getEleveActuel();
        if (!eleve) return;

        const trimestreId = this.currentTrimestreState.trimestreId;
        const cleVerrouillage = this.getCleVerrouillage(eleve.id, trimestreId);

        this.notesTrimestreVerrouilles.add(cleVerrouillage);
        this.sauvegarderNotesTrimestreLocalStorage(eleve.id, trimestreId);
        this.currentTrimestreState.elevesEnregistres.add(eleve.id);
        this.sauvegarderNotesTemporaires();

        this.showConfirmationTrimestreModal = false;

        const indexSuivant = this.currentTrimestreState.eleveIndex + 1;
        if (indexSuivant < this.currentTrimestreState.eleves.length) {
            this.currentTrimestreState.eleveIndex = indexSuivant;
            const trimestre = this.evenements.find(e => e.id === trimestreId);
            if (trimestre) {
                this.preparerFormulaireTrimestre(trimestre);
            }
        }
    }

    calculerClassementGlobal(): void {
        if (!this.currentTrimestreState) return;
        
        const trimestreId = this.currentTrimestreState.trimestreId;
        const eleves = this.currentTrimestreState.eleves;
        const trimestre = this.evenements.find(e => e.id === trimestreId);
        
        if (!trimestre) return;
        
        const moyennes: { eleve: Eleve; moyenne: number }[] = [];
        
        for (const eleve of eleves) {
            const cleVerrouillage = this.getCleVerrouillage(eleve.id, trimestreId);
            if (!this.notesTrimestreVerrouilles.has(cleVerrouillage)) continue;
            
            const notes = this.notesTrimestreStore.get(eleve.id) || [];
            if (notes.length === 0) continue;
            
            let totalCoef = 0;
            let totalMoyCoef = 0;
            
            for (const note of notes) {
                if (note.trimestreId === trimestreId) {
                    totalCoef += note.coefficient || 0;
                    totalMoyCoef += (note.moyenneCoefficientee || 0);
                }
            }
            
            const moyenne = totalCoef > 0 ? totalMoyCoef / totalCoef : 0;
            moyennes.push({ eleve, moyenne });
        }
        
        moyennes.sort((a, b) => b.moyenne - a.moyenne);
        
        this.classementGlobal = moyennes.map((item, index) => ({
            ...item,
            rang: index + 1
        }));
        
        this.premiereMoyenneClasse = this.classementGlobal.length > 0 ? this.classementGlobal[0].moyenne : 0;
        this.showClassementGlobal = true;
    }

    fermerClassementGlobal(): void {
        this.showClassementGlobal = false;
        this.classementGlobal = [];
    }
    
    /**
     * ==================================================================================================================================
     * GÉNÉRER LE BULLETIN PDF POUR LA CONSULTATION
     * ==================================================================================================================================
     * Génère le bulletin scolaire PDF pour le popup d'aperçu.
     * @param eleve - Élève pour lequel générer le bulletin
     * @param premiereMoyenne - Moyenne du premier de la classe (optionnel)
     * @param trimestreId - ID du trimestre spécifique à utiliser (optionnel)
     */
    async genererBulletinPdf(eleve: Eleve | null, premiereMoyenne?: number, trimestreId?: number): Promise<void> {
        if (!eleve) return;
        
        // Utiliser le trimestre fourni, ou le trimestre actuel depuis currentTrimestreState
        const trimestreIdsToSearch: number[] = [];
        if (trimestreId) {
            trimestreIdsToSearch.push(trimestreId);
        } else if (this.currentTrimestreState) {
            trimestreIdsToSearch.push(this.currentTrimestreState.trimestreId);
        } else {
            // Fallback: chercher dans tous les événements
            for (const evt of this.evenements) {
                trimestreIdsToSearch.push(evt.id);
            }
        }
        
        // Chercher les notes pour les trimestreIds définis
        for (const triId of trimestreIdsToSearch) {
            const cleStorage = `notes_trimestre_${triId}_${eleve.id}`;
            const data = localStorage.getItem(cleStorage);
            
            if (data) {
                try {
                    const notes: any[] = JSON.parse(data);
                    
                    if (notes.length > 0) {
                        // Trouver le trimestre par ID
                        const trimestre = this.evenements.find(e => e.id === triId);
                        if (!trimestre) continue;
                        
                        // Calculer la moyenne
                        let totalCoef = 0;
                        let totalMoyCoef = 0;
                        
                        for (const note of notes) {
                            totalCoef += note.coefficient || 0;
                            totalMoyCoef += (note.moyenneCoefficientee || 0);
                        }
                        
                        const moyenne = totalCoef > 0 ? totalMoyCoef / totalCoef : 0;
                        
                        const dataPdf: any = {
                            nomEcole: 'Nom de l\'École',
                            nom: eleve.nom,
                            prenoms: eleve.prenom,
                            classe: this.classeConsultation || '',
                            trimestre: trimestre.titre,
                            anneeScolaire: this.getAnneeScolaire(),
                            matieres: notes,
                            moyenneTrimestre: Math.round(moyenne * 100) / 100
                        };
                        
                        if (premiereMoyenne !== undefined) {
                            dataPdf.premiereMoyenne = premiereMoyenne;
                        }
                        
                        // Générer le PDF et afficher dans le popup d'aperçu
                        const pdfDataUri = await BulletinPdfComponent.genererPdfDirect(dataPdf);
                        this.pdfApercuUrl = pdfDataUri;
                        this.pdfApercuSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfDataUri);
                        this.showApercuBulletin = true;
                        return;
                    }
                } catch (e) {
                    console.error('Erreur:', e);
                }
            }
        }
        
        alert('Aucune note de trimestre trouvée pour cet élève');
    }
    
    /**
     * ==================================================================================================================================
     * ENVOYER LE BULLETIN PAR WHATSAPP AU PARENT
     * ==================================================================================================================================
     * Ouvre WhatsApp avec le numéro du parent pour envoyer le bulletin.
     * Utilise l'API WhatsApp: https://wa.me/
     * 
     * @param eleve - Élève dont le parent doit recevoir le bulletin
     */
async envoyerBulletinWhatsApp(eleve: Eleve | null): Promise<void> {
        if (!eleve) return;
        
        // Vérifier si l'aperçu du PDF est généré
        if (!this.pdfApercuUrl) {
            // Générer d'abord le PDF
            await this.genererBulletinPdf(eleve);
        }
        
        // Récupérer le numéro du parent
        const telephoneParent = (eleve as any).telephoneParent || (eleve as any).parent || (eleve as any).telephone;
        
        console.log('Téléphone parent:', telephoneParent);
        console.log('Élève:', eleve);
        
        if (!telephoneParent) {
            alert('Numéro WhatsApp du parent non disponible pour cet élève');
            return;
        }
        
        // Nettoyer le numéro (supprimer tous les caractères non numériques sauf le +)
        let numeroClean = telephoneParent.replace(/[^\d\+]/g, '');
        
        // Si le numéro commence par +, le garder tel quel
        // Sinon, ajouter l'indicatif Mali (+223)
        let numeroWhatsApp = numeroClean;
        if (!numeroClean.startsWith('+')) {
            // Ajouter l'indicatif Mali
            numeroWhatsApp = '+223' + numeroClean.replace(/^0+/, '');
        }
        
        // Enlever les doublons d'indicatif
        numeroWhatsApp = numeroWhatsApp.replace(/^\+223223/, '+223');
        
        console.log('Numéro WhatsApp:', numeroWhatsApp);
        
        // Message à envoyer
        const message = `Bonjour, voici le bulletin scolaire de ${eleve.prenom} ${eleve.nom}. Veuillez trouver ci-joint le document.`;
        
        // Encoder le message
        const messageEncoded = encodeURIComponent(message);
        
        // Ouvrir WhatsApp
        window.open(`https://wa.me/${numeroWhatsApp}?text=${messageEncoded}`, '_blank');
    }

    /**
     * ==================================================================================================================================
     * OBTENIR L'ANNÉE SCOLAIRE
     * ==================================================================================================================================
     * Retourne l'année scolaire au format "2025 - 2026" (année actuelle - 1 - année actuelle).
     */
    private getAnneeScolaire(): string {
        const year = new Date().getFullYear();
        return `${year - 1} - ${year}`;
    }
    
    /**
     * ==================================================================================================================================
     * TÉLÉCHARGER LE BULLETIN PDF
     * ==================================================================================================================================
     * Télécharge le PDF généré localement.
     */
    telechargerBulletin(): void {
        if (!this.pdfApercuUrl) return;
        
        const eleve = this.eleveActuelConsultation;
        const nomFichier = eleve ? `Bulletin_${eleve.nom}_${eleve.prenom}.pdf` : 'Bulletin.pdf';
        
        const link = document.createElement('a');
        link.href = this.pdfApercuUrl;
        link.download = nomFichier;
        link.click();
    }

    /**
     * ==================================================================================================================================
     * TÉLÉCHARGER DIRECTEMENT LE PDF DU BULLETIN SANS AFFICHER LE POPUP
     * ==================================================================================================================================
     * Génère et télécharger le PDF directement sans afficher l'aperçu.
     * @param eleve - Élève pour lequel générer le bulletin
     * @param premiereMoyenne - Moyenne du premier de la classe (optionnel)
     * @param trimestreId - ID du trimestre spécifique à utiliser (optionnel)
     */
    async telechargerBulletinPdf(eleve: Eleve, premiereMoyenne?: number, trimestreId?: number): Promise<void> {
        if (!eleve) return;

        // Utiliser le trimestre fourni, ou le trimestre actuel depuis currentTrimestreState
        const trimestreIdsToSearch: number[] = [];
        if (trimestreId) {
            trimestreIdsToSearch.push(trimestreId);
        } else if (this.currentTrimestreState) {
            trimestreIdsToSearch.push(this.currentTrimestreState.trimestreId);
        } else {
            for (const evt of this.evenements) {
                trimestreIdsToSearch.push(evt.id);
            }
        }

        for (const triId of trimestreIdsToSearch) {
            const cleStorage = `notes_trimestre_${triId}_${eleve.id}`;
            const data = localStorage.getItem(cleStorage);
            
            if (data) {
                try {
                    const notes: any[] = JSON.parse(data);
                    if (notes.length > 0) {
                        const trimestre = this.evenements.find(e => e.id === triId);
                        if (!trimestre) continue;
                        
                        let totalCoef = 0;
                        let totalMoyCoef = 0;
                        
                        for (const note of notes) {
                            totalCoef += note.coefficient || 0;
                            totalMoyCoef += (note.moyenneCoefficientee || 0);
                        }
                        
                        const moyenne = totalCoef > 0 ? totalMoyCoef / totalCoef : 0;
                        
                        const dataPdf: any = {
                            nomEcole: 'Nom de l\'École',
                            nom: eleve.nom,
                            prenoms: eleve.prenom,
                            classe: this.classeConsultation || '',
                            trimestre: trimestre.titre,
                            anneeScolaire: this.getAnneeScolaire(),
                            matieres: notes,
                            moyenneTrimestre: Math.round(moyenne * 100) / 100
                        };
                        
                        if (premiereMoyenne !== undefined) {
                            dataPdf.premiereMoyenne = premiereMoyenne;
                        }
                        
                        const pdfDataUri = await BulletinPdfComponent.genererPdfDirect(dataPdf);
                        
                        const link = document.createElement('a');
                        link.href = pdfDataUri;
                        link.download = `Bulletin_${eleve.nom}_${eleve.prenom}.pdf`;
                        link.click();
                        return;
                    }
                } catch (e) {
                    console.error('Erreur:', e);
                }
            }
        }
        
        alert('Aucune note de trimestre trouvée pour cet élève');
    }
    
    /**
     * ==================================================================================================================================
     * FERMER L'APERÇU DU BULLETIN
     * ==================================================================================================================================
     */
    fermerApercuBulletin(): void {
        this.showApercuBulletin = false;
        this.pdfApercuUrl = null;
    }

    /**
     * ==================================================================================================================================
     * SAUVEGARDER DANS LOCALSTORAGE
     * ==================================================================================================================================
     */
    private sauvegarderNotesTrimestreLocalStorage(eleveId: number, trimestreId: number): void {
        try {
            const notesTemp = this.donneesTempTrimestre[eleveId];
            if (!notesTemp || notesTemp.length === 0) return;

            const cleStorage = `notes_trimestre_${trimestreId}_${eleveId}`;
            let notesExistantes: NoteTrimestre[] = [];
            const dataExistante = localStorage.getItem(cleStorage);
            if (dataExistante) {
                try { notesExistantes = JSON.parse(dataExistante); } catch (e) { notesExistantes = []; }
            }

            notesTemp.forEach(ligne => {
                notesExistantes.push({
                    id: Date.now() + Math.random(),
                    eleveId: eleveId,
                    trimestreId: trimestreId,
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

            localStorage.setItem(cleStorage, JSON.stringify(notesExistantes));
            this.notesTrimestreStore.set(eleveId, notesExistantes);
        } catch (error) {
            console.error('Erreur sauvegarde notes:', error);
        }
    }

    /**
     * ==================================================================================================================================
     * CHARGER LES NOTES VERRROUILLÉES DEPUIS LOCALSTORAGE
     * ==================================================================================================================================
     */
    chargerNotesVerrouilleesLocalStorage(): void {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const cle = localStorage.key(i);
                if (cle && cle.startsWith('notes_trimestre_')) {
                    const parts = cle.replace('notes_trimestre_', '').split('_');
                    if (parts.length >= 2) {
                        const trimestreId = parseInt(parts[0], 10);
                        const eleveId = parseInt(parts[1], 10);
                        if (!isNaN(trimestreId) && !isNaN(eleveId)) {
                            const cleVerrouillage = this.getCleVerrouillage(eleveId, trimestreId);
                            this.notesTrimestreVerrouilles.add(cleVerrouillage);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erreur chargement notes verrouillées:', error);
        }
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