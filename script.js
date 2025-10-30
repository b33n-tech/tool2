// Variables globales
let architectureData = null;
let completionStatus = {};

// Fonction pour charger le fichier JSON
document.getElementById('load-json').addEventListener('click', () => {
    document.getElementById('json-upload').click();
});

document.getElementById('json-upload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            architectureData = JSON.parse(e.target.result);
            if (!architectureData.architecture) {
                throw new Error("Format JSON invalide : la clé 'architecture' est manquante.");
            }
            renderTree(architectureData.architecture);
            document.getElementById('download-json').disabled = false;
        } catch (error) {
            alert(`Erreur de chargement : ${error.message}`);
        }
    };
    reader.readAsText(file);
});

// Fonction pour afficher l'arborescence
function renderTree(nodes, parentElement = document.getElementById('tree-container'), level = 0) {
    nodes.forEach(node => {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.dataset.level = level;

        const header = document.createElement('div');
        header.className = 'tree-node-header';
        header.textContent = node.titre;
        header.addEventListener('click', () => {
            header.classList.toggle('expanded');
            const content = header.nextElementSibling;
            content.classList.toggle('visible');
        });

        const content = document.createElement('div');
        content.className = 'tree-node-content';

        const textarea = document.createElement('textarea');
        textarea.placeholder = `Décrivez le contenu de la section "${node.titre}"...`;
        textarea.addEventListener('input', () => {
            updateCompletionStatus();
        });

        const status = document.createElement('span');
        status.className = 'node-status';
        status.textContent = '✗';

        content.appendChild(textarea);
        content.appendChild(status);
        nodeElement.appendChild(header);
        nodeElement.appendChild(content);
        parentElement.appendChild(nodeElement);

        // Gestion des sous-sections
        if (node.sous_sections && node.sous_sections.length > 0) {
            renderTree(node.sous_sections, content, level + 1);
        }
    });
}

// Fonction pour mettre à jour l'indicateur de complétion
function updateCompletionStatus() {
    const textareas = document.querySelectorAll('textarea');
    let completed = 0;

    textareas.forEach(textarea => {
        const status = textarea.nextElementSibling;
        if (textarea.value.trim() !== '') {
            status.textContent = '✓';
            status.classList.add('completed');
            completed++;
        } else {
            status.textContent = '✗';
            status.classList.remove('completed');
        }
    });

    const total = textareas.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('completion-indicator').textContent = `${percentage}% complété`;
}

// Fonction pour télécharger le JSON
document.getElementById('download-json').addEventListener('click', () => {
    if (!architectureData) return;

    const textareas = document.querySelectorAll('textarea');
    const updatedArchitecture = JSON.parse(JSON.stringify(architectureData));

    function updateNodeContent(nodes) {
        nodes.forEach(node => {
            const textarea = document.querySelector(`[data-level="${node.niveau - 1}"] textarea`);
            if (textarea) {
                node.contenu = textarea.value;
            }
            if (node.sous_sections) {
                updateNodeContent(node.sous_sections);
            }
        });
    }

    updateNodeContent(updatedArchitecture.architecture);

    const dataStr = JSON.stringify(updatedArchitecture, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'contenu_structure.json';
    a.click();
    URL.revokeObjectURL(url);
});
