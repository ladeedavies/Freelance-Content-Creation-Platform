;; Dispute Resolution Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_STATUS (err u400))

;; Define dispute statuses
(define-constant STATUS_OPEN u1)
(define-constant STATUS_VOTING u2)
(define-constant STATUS_RESOLVED u3)

;; Data Maps
(define-map disputes
  { dispute-id: uint }
  {
    client: principal,
    creator: principal,
    description: (string-utf8 1000),
    status: uint,
    resolution: (optional (string-utf8 1000)),
    votes-for-client: uint,
    votes-for-creator: uint
  }
)

(define-map votes
  { dispute-id: uint, voter: principal }
  { vote: bool }
)

(define-data-var dispute-nonce uint u0)

;; Functions
(define-public (file-dispute (client principal) (creator principal) (description (string-utf8 1000)))
  (let
    ((new-dispute-id (+ (var-get dispute-nonce) u1)))
    (map-set disputes
      { dispute-id: new-dispute-id }
      {
        client: client,
        creator: creator,
        description: description,
        status: STATUS_OPEN,
        resolution: none,
        votes-for-client: u0,
        votes-for-creator: u0
      }
    )
    (var-set dispute-nonce new-dispute-id)
    (ok new-dispute-id)
  )
)

(define-public (start-voting (dispute-id uint))
  (let
    ((dispute (unwrap! (map-get? disputes { dispute-id: dispute-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status dispute) STATUS_OPEN) ERR_INVALID_STATUS)
    (ok (map-set disputes
      { dispute-id: dispute-id }
      (merge dispute { status: STATUS_VOTING })
    ))
  )
)

(define-public (vote-on-dispute (dispute-id uint) (vote-for-client bool))
  (let
    ((dispute (unwrap! (map-get? disputes { dispute-id: dispute-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq (get status dispute) STATUS_VOTING) ERR_INVALID_STATUS)
    (asserts! (not (is-some (map-get? votes { dispute-id: dispute-id, voter: tx-sender }))) ERR_NOT_AUTHORIZED)
    (map-set votes { dispute-id: dispute-id, voter: tx-sender } { vote: vote-for-client })
    (ok (map-set disputes
      { dispute-id: dispute-id }
      (merge dispute {
        votes-for-client: (if vote-for-client (+ (get votes-for-client dispute) u1) (get votes-for-client dispute)),
        votes-for-creator: (if vote-for-client (get votes-for-creator dispute) (+ (get votes-for-creator dispute) u1))
      })
    ))
  )
)

(define-public (resolve-dispute (dispute-id uint) (resolution (string-utf8 1000)))
  (let
    ((dispute (unwrap! (map-get? disputes { dispute-id: dispute-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status dispute) STATUS_VOTING) ERR_INVALID_STATUS)
    (ok (map-set disputes
      { dispute-id: dispute-id }
      (merge dispute { status: STATUS_RESOLVED, resolution: (some resolution) })
    ))
  )
)

(define-read-only (get-dispute (dispute-id uint))
  (map-get? disputes { dispute-id: dispute-id })
)

(define-read-only (get-vote (dispute-id uint) (voter principal))
  (map-get? votes { dispute-id: dispute-id, voter: voter })
)

