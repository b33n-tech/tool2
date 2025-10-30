// Variables globales
let architectureData = null;
let completionStatus = {};

// Chargement du JSON
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
            if (!Array.isArray(architectureData)) {
                throw new Error("Format JSON invalide : un tableau est attendu.");
            }
            renderTree(architectureData);
            document.getElementById('download-json').disabled = false;
        } catch (error) {
            alert(`Erreur de chargement : ${error.message}`);
        }
    };
    reader.readAsText(file);
});

// Affichage de l'arborescence
function renderTree(nodes, parentElement = document.getElementById('tree-container'), level = 0) {
    nodes.forEach(node => {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.dataset.id = node.id;
        nodeElement.dataset.level = level;

        const header = document.createElement('div');
        header.className = 'tree-node-header';
        header.innerHTML = `<strong>${node.numbering || ''} ${node.title}</strong>`;
        header.addEventListener('click', () => {
            header.classList.toggle('expanded');
            const content = header.nextElementSibling;
            content.classList.toggle('visible');
        });

        const content = document.createElement('div');
        content.className = 'tree-node-content';

        const textarea = document.createElement('textarea');
        textarea.placeholder = `Décrivez le contenu de la section "${node.title}"...`;
        textarea.value = node.summary || node.pitch || '';
        textarea.addEventListener('input', () => {
            updateCompletionStatus();
        });

        const status = document.createElement('span');
        status.className = 'node-status';
        status.textContent = textarea.value.trim() !== '' ? '✓' : '✗';
        if (textarea.value.trim() !== '') {
            status.classList.add('completed');
        }

        content.appendChild(textarea);
        content.appendChild(status);
        nodeElement.appendChild(header);
        nodeElement.appendChild(content);
        parentElement.appendChild(nodeElement);

        // Gestion des sous-sections (si elles existent dans ton JSON)
        // Dans ton exemple, il n'y a pas de sous-sections imbriquées, mais si tu en ajoutes plus tard :
        const subSections = architectureData.filter(n => n.level === level + 1 && n.numbering.startsWith(node.numbering));
        if (subSections.length > 0) {
            renderTree(subSections, content, level + 1);
        }
    });
}

// Mise à jour de l'indicateur de complétion
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

// Téléchargement du JSON
document.getElementById('download-json').addEventListener('click', () => {
    if (!architectureData) return;

    const textareas = document.querySelectorAll('textarea');
    const updatedData = JSON.parse(JSON.stringify(architectureData));

    textareas.forEach(textarea => {
        const nodeId = textarea.closest('.tree-node').dataset.id;
        const node = updatedData.find(n => n.id === nodeId);
        if (node) {
            node.summary = textarea.value;
        }
    });

    const dataStr = JSON.stringify(updatedData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'contenu_structure.json';
    a.click();
    URL.revokeObjectURL(url);
});
