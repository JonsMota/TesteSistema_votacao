const api = '/api/polls'
const socket = window.io ? window.io() : null

const els = {
  serverStatus: document.getElementById('serverStatus'),
  pollForm: document.getElementById('pollForm'),
  formTitle: document.getElementById('formTitle'),
  cancelEditButton: document.getElementById('cancelEditButton'),
  addOptionButton: document.getElementById('addOptionButton'),
  optionsContainer: document.getElementById('optionsContainer'),
  formMessage: document.getElementById('formMessage'),
  pollList: document.getElementById('pollList'),
  pollDetail: document.getElementById('pollDetail'),
  title: document.getElementById('title'),
  startAt: document.getElementById('startAt'),
  endAt: document.getElementById('endAt')
}

let polls = []
let selectedPollId = null
let editingPollId = null

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(dateValue))
}

function totalVotes(poll) {
  return poll.options.reduce((sum, option) => sum + option.votes, 0)
}

function setMessage(message, isError = true) {
  els.formMessage.textContent = message || ''
  els.formMessage.style.color = isError ? '#fca5a5' : '#86efac'
}

function renderOptionInputs(values = ['', '', '']) {
  els.optionsContainer.innerHTML = ''

  values.forEach((value, index) => {
    const row = document.createElement('div')
    row.className = 'option-row'

    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = `Opção ${index + 1}`
    input.value = value

    const removeButton = document.createElement('button')
    removeButton.type = 'button'
    removeButton.className = 'icon-button'
    removeButton.textContent = '−'
    removeButton.disabled = els.optionsContainer.children.length <= 3
    removeButton.addEventListener('click', () => {
      if (els.optionsContainer.children.length <= 3) {
        return
      }
      row.remove()
      updateRemoveButtons()
    })

    row.appendChild(input)
    row.appendChild(removeButton)
    els.optionsContainer.appendChild(row)
  })

  updateRemoveButtons()
}

function updateRemoveButtons() {
  const rows = Array.from(els.optionsContainer.querySelectorAll('.option-row'))
  rows.forEach((row) => {
    const button = row.querySelector('button')
    if (button) {
      button.disabled = rows.length <= 3
    }
  })
}

function addOptionRow() {
  const rowCount = els.optionsContainer.querySelectorAll('.option-row').length
  const row = document.createElement('div')
  row.className = 'option-row'

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = `Opção ${rowCount + 1}`

  const removeButton = document.createElement('button')
  removeButton.type = 'button'
  removeButton.className = 'icon-button'
  removeButton.textContent = '−'
  removeButton.addEventListener('click', () => {
    if (els.optionsContainer.querySelectorAll('.option-row').length <= 3) {
      return
    }
    row.remove()
    updateRemoveButtons()
  })

  row.appendChild(input)
  row.appendChild(removeButton)
  els.optionsContainer.appendChild(row)
  updateRemoveButtons()
}

function getFormOptions() {
  return Array.from(els.optionsContainer.querySelectorAll('input'))
    .map((input) => input.value.trim())
    .filter(Boolean)
}

function validateForm(payload) {
  if (!payload.title) {
    return 'Informe o título da enquete.'
  }

  if (!payload.startAt || !payload.endAt) {
    return 'Informe as datas de início e término.'
  }

  if (payload.options.length < 3) {
    return 'Adicione no mínimo 3 opções.'
  }

  if (new Date(payload.startAt) >= new Date(payload.endAt)) {
    return 'A data de início deve ser menor que a data de término.'
  }

  return null
}

function getSelectedPoll() {
  return polls.find((poll) => poll.id === selectedPollId) || polls[0] || null
}

function renderPollList() {
  if (!polls.length) {
    els.pollList.innerHTML = '<p class="empty-state">Nenhuma enquete cadastrada ainda.</p>'
    return
  }

  els.pollList.innerHTML = polls
    .map((poll) => {
      const activeClass = poll.status === 'em andamento' ? 'active' : ''
      return `
        <article class="poll-card ${activeClass}">
          <div class="poll-card-header">
            <div>
              <p class="eyebrow">#${poll.id}</p>
              <h3>${poll.title}</h3>
            </div>
            <span class="badge ${poll.status === 'em andamento' ? 'running' : poll.status === 'finalizada' ? 'finished' : 'pending'}">
              ${poll.status}
            </span>
          </div>
          <div class="poll-submeta">
            <span>Início: ${formatDate(poll.startAt)}</span>
            <span>Término: ${formatDate(poll.endAt)}</span>
            <span>Votos: ${totalVotes(poll)}</span>
          </div>
          <div class="card-actions">
            <button class="select-button" data-action="select" data-id="${poll.id}">Ver enquete</button>
            <button class="edit-button" data-action="edit" data-id="${poll.id}">Editar</button>
            <button class="delete-button" data-action="delete" data-id="${poll.id}">Excluir</button>
          </div>
        </article>
      `
    })
    .join('')
}

function renderPollDetail() {
  const poll = getSelectedPoll()

  if (!poll) {
    els.pollDetail.className = 'empty-state'
    els.pollDetail.textContent = 'Selecione uma enquete para ver os detalhes.'
    return
  }

  const isActive = poll.status === 'em andamento'
  els.pollDetail.className = 'poll-detail'
  els.pollDetail.innerHTML = `
    <div class="poll-card-header">
      <div>
        <p class="eyebrow">#${poll.id}</p>
        <h3>${poll.title}</h3>
      </div>
      <span class="badge ${isActive ? 'running' : poll.status === 'finalizada' ? 'finished' : 'pending'}">${poll.status}</span>
    </div>

    <div class="poll-meta">
      <span>Início: ${formatDate(poll.startAt)}</span>
      <span>Término: ${formatDate(poll.endAt)}</span>
      <span>Total de votos: ${totalVotes(poll)}</span>
    </div>

    <div class="vote-list">
      ${poll.options
        .map(
          (option) => `
            <div class="vote-row">
              <div>
                <strong>${option.text}</strong>
                <span>${option.votes} voto(s)</span>
              </div>
              <button
                class="vote-button"
                data-action="vote"
                data-poll-id="${poll.id}"
                data-option-id="${option.id}"
                ${isActive ? '' : 'disabled'}
              >
                Votar
              </button>
            </div>
          `
        )
        .join('')}
    </div>

    <p class="message" style="color: ${isActive ? '#86efac' : '#fbbf24'};">
      ${isActive ? 'Enquete ativa para votação.' : 'Esta enquete não está ativa neste momento.'}
    </p>
  `
}

async function fetchPolls(keepSelection = true) {
  const response = await fetch(api)
  polls = await response.json()

  if (!polls.length) {
    selectedPollId = null
  } else if (!keepSelection || !polls.some((poll) => poll.id === selectedPollId)) {
    selectedPollId = polls[0].id
  }

  renderPollList()
  renderPollDetail()
}

function clearForm() {
  editingPollId = null
  els.formTitle.textContent = 'Nova enquete'
  els.cancelEditButton.classList.add('hidden')
  els.pollForm.reset()
  renderOptionInputs(['', '', ''])
  setMessage('')
}

function fillForm(poll) {
  editingPollId = poll.id
  els.formTitle.textContent = `Editando enquete #${poll.id}`
  els.cancelEditButton.classList.remove('hidden')
  els.title.value = poll.title
  els.startAt.value = new Date(poll.startAt).toISOString().slice(0, 16)
  els.endAt.value = new Date(poll.endAt).toISOString().slice(0, 16)
  renderOptionInputs(poll.options.map((option) => option.text))
  setMessage('Editando enquete selecionada.', false)
}

async function handleSubmit(event) {
  event.preventDefault()

  const payload = {
    title: els.title.value.trim(),
    startAt: els.startAt.value,
    endAt: els.endAt.value,
    options: getFormOptions()
  }

  const validationError = validateForm(payload)
  if (validationError) {
    setMessage(validationError)
    return
  }

  try {
    const response = await fetch(editingPollId ? `${api}/${editingPollId}` : api, {
      method: editingPollId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Não foi possível salvar a enquete.')
    }

    setMessage(editingPollId ? 'Enquete atualizada com sucesso.' : 'Enquete criada com sucesso.', false)
    clearForm()
    await fetchPolls(false)
  } catch (error) {
    setMessage(error.message)
  }
}

async function handleListClick(event) {
  const button = event.target.closest('button')

  if (!button) {
    return
  }

  const pollId = Number(button.dataset.id)
  const action = button.dataset.action
  const poll = polls.find((item) => item.id === pollId)

  if (!poll) {
    return
  }

  if (action === 'select') {
    selectedPollId = pollId
    renderPollDetail()
    return
  }

  if (action === 'edit') {
    fillForm(poll)
    selectedPollId = pollId
    renderPollDetail()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  if (action === 'delete') {
    const confirmDelete = window.confirm(`Excluir a enquete "${poll.title}"?`)

    if (!confirmDelete) {
      return
    }

    const response = await fetch(`${api}/${pollId}`, { method: 'DELETE' })

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}))
      setMessage(errorData.message || 'Não foi possível excluir a enquete.')
      return
    }

    if (selectedPollId === pollId) {
      selectedPollId = null
    }

    await fetchPolls(false)
    setMessage('Enquete excluída com sucesso.', false)
  }
}

async function handleVote(event) {
  const button = event.target.closest('button[data-action="vote"]')

  if (!button || button.disabled) {
    return
  }

  const pollId = Number(button.dataset.pollId)
  const optionId = Number(button.dataset.optionId)

  try {
    const response = await fetch(`${api}/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Falha ao registrar voto.')
    }

    polls = polls.map((poll) => (poll.id === data.id ? data : poll))
    selectedPollId = data.id
    renderPollList()
    renderPollDetail()
  } catch (error) {
    setMessage(error.message)
  }
}

function setupListeners() {
  els.pollForm.addEventListener('submit', handleSubmit)
  els.addOptionButton.addEventListener('click', addOptionRow)
  els.cancelEditButton.addEventListener('click', clearForm)
  els.pollList.addEventListener('click', handleListClick)
  els.pollDetail.addEventListener('click', handleVote)
}

async function init() {
  renderOptionInputs(['', '', ''])
  setupListeners()

  try {
    await fetchPolls()
    els.serverStatus.textContent = 'Online'
  } catch (error) {
    els.serverStatus.textContent = 'Erro ao carregar'
    setMessage('Não foi possível carregar as enquetes.')
  }

  if (socket) {
    socket.on('connect', () => {
      els.serverStatus.textContent = 'Online'
    })

    socket.on('polls:changed', async () => {
      await fetchPolls(true)
    })

    socket.on('disconnect', () => {
      els.serverStatus.textContent = 'Desconectado'
    })
  }
}

init()
