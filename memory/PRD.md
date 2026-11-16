# PATY INVESTIGA — PRD

## Original problem statement
Portal de notícias sobre Angra dos Reis chamado PATY INVESTIGA: páginas de entrevistas, matérias em vídeo, reels, colunas sociais; todas com comentários, like e compartilhar; site moderno, cores alegres, logo com lupa de detetive; área de administrador para criar/editar postagens.

## User choices
- Login: email + senha (Clerk gerenciado pela Emergent); ADMIN_EMAIL=marcusolipe.arte@gmail.com
- Leitores comentam só com nome
- Mídia: upload (Emergent Object Storage) E links YouTube/Instagram
- Cidade: Angra dos Reis

## Architecture
FastAPI + MongoDB (posts, comments, users, files) + React (Tailwind, shadcn). Clerk auth with roles admin/member. Object storage served via /api/files/{path}.

## Implemented (2026-06)
- Home (hero, ticker, seções, bandeja de reels), páginas Notícias/Entrevistas/Vídeos/Colunas com busca, detalhe com like/compartilhar/comentários
- Reels verticais com snap, like, gaveta de comentários, compartilhar
- Painel admin: CRUD de postagens (upload ou link), moderação de comentários, gestão de usuários/papéis
- Logo gerada (lupa + nome), seed com 9 postagens de exemplo

- Agenda de Eventos (tipo 'evento' com data/hora/local): página /agenda com calendário que destaca dias, lista por mês, filtro por dia; seção 'Próximos eventos' na home; campos de evento no painel; like/compartilhar/comentários nos eventos

## Backlog
- P1: Newsletter/WhatsApp de novas matérias; editor de texto rico; agendamento de posts
- P2: Contagem de visualizações / mais lidas; categorias filtráveis; streaming de vídeo com range
