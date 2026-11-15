# Main branch change log

## Scope and attribution

This log covers all 98 commits reachable from `origin/main` through `96d2447`
on 2026-11-02. The checked-out local `main` was at `9cc4046`, four commits
behind that remote tip.

The commit table is in Git's reverse history order. Names are the commit
authors recorded by Git; they are not independently verified identities.
File-action counts compare each commit with its first parent, detect renames,
and do not count merge commits' combined changes a second time.

## File actions by commit author

`A` means added, `D` means deleted, `M` means modified, and `R` means renamed.
These are file-action counts, not counts of distinct people or lines changed.

| Git author | Added (A) | Deleted (D) | Modified (M) | Renamed (R) |
|---|---:|---:|---:|---:|
| TaiHo | 145 | 56 | 101 | 10 |
| Nghiaphan123 | 75 | 2 | 96 | 15 |
| Baotris-23 | 40 | 0 | 65 | 0 |
| undertaker-rpl | 21 | 0 | 37 | 0 |

In short, Git credits **TaiHo** and **Nghiaphan123** with file additions and
deletions; Git credits **TaiHo**, **Nghiaphan123**, **Baotris-23**, and
**undertaker-rpl** with modifications. Renames are shown separately rather
than counted as additions or deletions. The history also contains 13 merge
commits, whose changes are represented by their constituent commits.

## Complete commit history

| Commit | Date | Author | Subject |
|---|---|---|---|
| `e09b019` | 2026-10-13 | Nghiaphan123 | Initial commit |
| `39aadd2` | 2026-10-12 | Nghiaphan123 | Add files via upload |
| `a43d6c6` | 2026-10-13 | TaiHo | fix file structure |
| `c65100b` | 2026-10-18 | TaiHo | add docs and fix existing |
| `ab6a28e` | 2026-10-18 | TaiHo | set up app |
| `e269d53` | 2026-10-18 | TaiHo | implement phase 1 |
| `dfbe968` | 2026-10-18 | TaiHo | change file location and merge file |
| `421159c` | 2026-10-18 | TaiHo | complete task D-08 |
| `5400762` | 2026-10-18 | TaiHo | finalize decisions |
| `68811ac` | 2026-10-18 | TaiHo | add class-domain graph |
| `11cec78` | 2026-10-19 | TaiHo | ửite D-07 |
| `4dc86cf` | 2026-10-19 | TaiHo | write D-10 |
| `5ae1180` | 2026-10-19 | TaiHo |  write D-11 |
| `7bb4f0b` | 2026-10-19 | Nghiaphan123 | docs(D-02): rename architecture/ard to adr and fix ADR links |
| `822caa7` | 2026-10-19 | Nghiaphan123 | chore(S-03): fix .gitignore, add .env.example, untrack tsbuildinfo |
| `5a9071e` | 2026-10-19 | Nghiaphan123 | docs(D-01): update decision log v0.2 |
| `e0ed314` | 2026-10-19 | Nghiaphan123 | docs(D-11): add ADR 015 Vitest (proposed) |
| `198157f` | 2026-10-19 | Nghiaphan123 | docs(T-01): add test strategy |
| `ea8da15` | 2026-10-19 | Nghiaphan123 | docs(D-14): update traceability matrix v0.2 |
| `5fdc6af` | 2026-10-19 | Nghiaphan123 | feat(C-03): Prisma schema, init migration and seed |
| `014f807` | 2026-10-19 | Nghiaphan123 | chore(S-04): docker compose and Dockerfiles |
| `0e24160` | 2026-10-19 | Nghiaphan123 | fix(C-01): API reads API_PORT then PORT |
| `469f596` | 2026-10-19 | Nghiaphan123 | docs(D-16): README skeleton |
| `60cd511` | 2026-10-19 | Nghiaphan123 | docs: update plan |
| `964ae88` | 2026-10-19 | Nghiaphan123 | docs(D-11): accept ADR 015 Vitest, supersede ADR 011 runner |
| `9cd101e` | 2026-10-19 | Nghiaphan123 | chore(C-01): remove @nestjs/observe APM agent from api |
| `b680075` | 2026-10-19 | Nghiaphan123 | docs(D-01): record confirmed decisions 16-18 |
| `514b102` | 2026-10-22 | Nghiaphan123 | feat: Add initial architecture, deployment guide, and diagrams for BrewLite |
| `67d6779` | 2026-10-22 | TaiHo | rewrite documentation (not fix gaps) |
| `b389a59` | 2026-10-22 | TaiHo | add notes |
| `c57c8cd` | 2026-10-22 | TaiHo | add readme check |
| `feb4fbc` | 2026-10-22 | TaiHo | small clean up |
| `d10b148` | 2026-10-22 | TaiHo | complete task 1 with (contain columns for task 10) |
| `a25f0d5` | 2026-10-22 | TaiHo | replace architecture.md |
| `1a653b8` | 2026-10-22 | TaiHo | complete task 2 |
| `eaee0df` | 2026-10-22 | TaiHo | complete task 4 |
| `aec9b4b` | 2026-10-22 | undertaker-rpl | docs(sprint-0): add sprint plan (Task 8) and wireframe 5 screens (Task 5) |
| `b397c62` | 2026-10-23 | TaiHo | change document owner |
| `e30beb7` | 2026-10-23 | TaiHo | complete task 3 |
| `1732d62` | 2026-10-23 | TaiHo | (missing commit) |
| `9faf9b5` | 2026-10-23 | TaiHo | review and flag document |
| `d3ecc9b` | 2026-10-23 | TaiHo | complete task 3 |
| `dc909e8` | 2026-10-23 | TaiHo | fix stale comments |
| `9083273` | 2026-10-23 | TaiHo | delete untrack .env |
| `608eb27` | 2026-10-23 | TaiHo | update packages |
| `59bf084` | 2026-10-23 | TaiHo | create HttpExceptionFilter and PrismaService |
| `496e45b` | 2026-10-23 | undertaker-rpl | docs(sprint-0): unify wireframes.md with wireframe-5.html and add sprint-plan.md |
| `d5db655` | 2026-10-23 | TaiHo | create order modules |
| `77f954e` | 2026-10-23 | TaiHo | create payment modules |
| `accf8c2` | 2026-10-23 | TaiHo | update apps |
| `37dbde0` | 2026-10-23 | TaiHo | add tests |
| `904d370` | 2026-10-23 | TaiHo | fix bug |
| `b71b700` | 2026-10-23 | TaiHo | document tests |
| `4f83c99` | 2026-10-23 | TaiHo | add loyalty tests |
| `8810546` | 2026-10-23 | TaiHo | complete task 10 |
| `d0aa028` | 2026-10-23 | TaiHo | check on task 7 |
| `93da6ba` | 2026-10-23 | TaiHo | Merge branch 'main' into dev2 |
| `07ebd39` | 2026-10-24 | TaiHo | add promotions |
| `0012728` | 2026-10-24 | Nghiaphan123 | feat(api): add products list and detail endpoints (Task 15) |
| `b23cf2c` | 2026-10-24 | Nghiaphan123 | feat(api): add order history and detail by code (Task 38) |
| `ea0df28` | 2026-10-24 | Nghiaphan123 | docs(api): record init migration drift in ADR 0003 (Task 38) |
| `3ac795f` | 2026-10-25 | Baotris-23 | feat(web): add ProductCard component |
| `b38140a` | 2026-10-25 | Baotris-23 | fix(api): tighten validation and auth handling |
| `bd877c6` | 2026-10-25 | undertaker-rpl | feat: hoàn thiện frontend, kết nối api và viết test |
| `13b85a8` | 2026-10-26 | Baotris-23 | feat(web): add menu page states |
| `43a35ec` | 2026-10-26 | Axo | Merge pull request #1 from Nghiaphan123/dev2 |
| `1073443` | 2026-10-26 | undertaker-rpl | chore: resolve merge conflict |
| `c095a15` | 2026-10-26 | Baotris-23 | Merge origin/main into dev3 |
| `d6ea9ed` | 2026-10-26 | undertaker-rpl | feat: fix ProductCard |
| `596fbcf` | 2026-10-27 | Baotris-23 | assets: add product images |
| `9bfa8a1` | 2026-10-27 | ItsBaoTri | Merge pull request #3 from Nghiaphan123/dev3 |
| `b25fd86` | 2026-10-27 | Baotris-23 | docs: document product image paths |
| `d17b618` | 2026-10-27 | ItsBaoTri | Merge pull request #4 from Nghiaphan123/dev3 |
| `1df0045` | 2026-10-27 | TaiHo | fix packages |
| `999c693` | 2026-10-27 | TaiHo | fix frontend |
| `41fc4e2` | 2026-10-27 | undertaker-rpl | fix api and web intergration |
| `986085b` | 2026-10-27 | undertaker-rpl | missing commit |
| `871b3cc` | 2026-10-27 | undertaker-rpl | Merge remote-tracking branch 'origin/main' into dev2 |
| `0760dfa` | 2026-10-27 | TaiHo | Merge remote-tracking branch 'origin/dev2' |
| `11137a0` | 2026-10-27 | undertaker-rpl | Improve menu, cart, and checkout UX |
| `cd3d620` | 2026-10-27 | undertaker-rpl | Merge remote-tracking branch 'origin/main' into dev2 |
| `d18589c` | 2026-10-27 | Baotris-23 | docs: document product image paths |
| `ac5e6d2` | 2026-10-28 | Baotris-23 | Merge origin/main into dev3 |
| `e2729eb` | 2026-10-28 | undertaker-rpl | fix(web): preserve cart and pending checkout on reload |
| `9e86abe` | 2026-10-28 | Baotris-23 | feat: update menu and product card |
| `bb876c0` | 2026-10-29 | Baotris-23 | feat(web): auth flow, profile, order details |
| `1a795ea` | 2026-10-29 | Baotris-23 | feat(web): auth flow, profile, order details |
| `ae997e9` | 2026-10-29 | Baotris-23 | Merge branch 'dev3' into main |
| `207ffc2` | 2026-10-29 | Baotris-23 | docs: update readme for auth/profile/orders |
| `1acc08d` | 2026-10-29 | Baotris-23 | fix frontend |
| `071b3bd` | 2026-10-29 | ItsBaoTri | Merge pull request #7 from Nghiaphan123/dev3 |
| `079d0b3` | 2026-10-31 | TaiHo | force theme to white |
| `c2bf342` | 2026-11-02 | TaiHo | fix menu page conflict |
| `9cc4046` | 2026-11-02 | Nghiaphan123 | fix(web): repair garbled menu text and align flow tests with current UI |
| `716cfac` | 2026-11-02 | Nghiaphan123 | feat(web): fix register flow, redesign auth screen, translate API errors |
| `9fdf4ec` | 2026-11-02 | Nghiaphan123 | feat: add cart API and loading states, fix order pricing and order pages |
| `f2a1a38` | 2026-11-02 | Nghiaphan123 | fix(web): allow changing payment method after creating a QR |
| `96d2447` | 2026-11-02 | Nghiaphan123 | Merge branch fix/web-menu-text-and-tests into main |
