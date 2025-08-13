import google.generativeai as genai
import os
import time

# --- CONFIGURATION ---
# 1. Collez votre clé API ici
API_KEY = "AIzaSyByCvoXzUewpUGaOBwOkCpkGQ95VdyCBfI"

# 2. Nom de votre fichier journal d'origine
NOM_FICHIER_INPUT = "journal.txt"

# 3. Nom du fichier corrigé qui sera créé
NOM_FICHIER_OUTPUT = "journal_corrige.txt"

# --- FIN DE LA CONFIGURATION ---

# On configure l'API avec votre clé
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash-latest')

def corriger_texte(texte_a_corriger):
    """Découpe le texte, l'envoie à l'API pour correction et le réassemble."""
    
    print("Découpage du texte en paragraphes...")
    # On découpe le texte par double saut de ligne (un bon indicateur de paragraphe)
    morceaux = texte_a_corriger.split('\n\n')
    morceaux_corriges = []
    
    nombre_total = len(morceaux)
    print(f"{nombre_total} morceaux à traiter.")

    for i, morceau in enumerate(morceaux):
        # Ignore les morceaux vides
        if not morceau.strip():
            continue

        print(f"Correction du morceau {i + 1}/{nombre_total}...")
        
        # Le prompt (l'instruction) donné à l'IA
        prompt = f"""
        Corrige l'orthographe, la grammaire, la ponctuation et la syntaxe du texte suivant. 
        Ne modifie pas le style, le ton, ni le contenu. 
        Réponds uniquement avec le texte corrigé, sans ajouter de commentaires.

        Texte à corriger :
        ---
        {morceau}
        """

        try:
            # Appel à l'API Gemini
            response = model.generate_content(prompt)
            texte_corrige = response.text
            morceaux_corriges.append(texte_corrige)
            
            # Pause d'une seconde pour respecter les limites de l'API (60 requêtes/minute)
            time.sleep(1)

        except Exception as e:
            print(f"--- ERREUR sur le morceau {i + 1} : {e} ---")
            print("--- Le morceau original sera utilisé à la place. ---")
            morceaux_corriges.append(morceau) # En cas d'erreur, on garde le morceau original

    print("\nRéassemblage du fichier final...")
    return "\n\n".join(morceaux_corriges)


# --- Programme Principal ---
if __name__ == "__main__":
    if API_KEY == "COLLEZ_VOTRE_CLÉ_API_ICI":
        print("ERREUR : Veuillez renseigner votre clé API dans le script.")
    else:
        try:
            print(f"Lecture du fichier '{NOM_FICHIER_INPUT}'...")
            with open(NOM_FICHIER_INPUT, 'r', encoding='utf-8') as f:
                contenu_original = f.read()

            contenu_corrige = corriger_texte(contenu_original)

            with open(NOM_FICHIER_OUTPUT, 'w', encoding='utf-8') as f:
                f.write(contenu_corrige)
            
            print(f"\nCorrection terminée ! Le journal corrigé a été enregistré dans '{NOM_FICHIER_OUTPUT}'.")

        except FileNotFoundError:
            print(f"ERREUR : Le fichier '{NOM_FICHIER_INPUT}' n'a pas été trouvé. Assurez-vous qu'il est dans le même dossier que le script.")
        except Exception as e:
            print(f"Une erreur inattendue est survenue : {e}")