import { describe, it, expect, beforeEach } from "vitest"

describe("Dispute Resolution", () => {
  let mockStorage: Map<string, any>
  let disputeNonce: number
  
  beforeEach(() => {
    mockStorage = new Map()
    disputeNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "file-dispute":
        const [client, creator, description] = args
        disputeNonce++
        mockStorage.set(`dispute-${disputeNonce}`, {
          client,
          creator,
          description,
          status: 1, // STATUS_OPEN
          resolution: null,
          votesForClient: 0,
          votesForCreator: 0,
        })
        return { success: true, value: disputeNonce }
      case "start-voting":
        const [disputeId] = args
        const dispute = mockStorage.get(`dispute-${disputeId}`)
        if (!dispute || dispute.status !== 1 || sender !== "CONTRACT_OWNER") {
          return { success: false, error: "Invalid dispute or not authorized" }
        }
        dispute.status = 2 // STATUS_VOTING
        mockStorage.set(`dispute-${disputeId}`, dispute)
        return { success: true }
      case "vote-on-dispute":
        const [voteDisputeId, voteForClient] = args
        const voteDispute = mockStorage.get(`dispute-${voteDisputeId}`)
        if (!voteDispute || voteDispute.status !== 2) {
          return { success: false, error: "Invalid dispute or not in voting status" }
        }
        if (voteForClient) {
          voteDispute.votesForClient++
        } else {
          voteDispute.votesForCreator++
        }
        mockStorage.set(`dispute-${voteDisputeId}`, voteDispute)
        return { success: true }
      case "resolve-dispute":
        const [resolveDisputeId, resolution] = args
        const resolveDispute = mockStorage.get(`dispute-${resolveDisputeId}`)
        if (!resolveDispute || resolveDispute.status !== 2 || sender !== "CONTRACT_OWNER") {
          return { success: false, error: "Invalid dispute or not authorized" }
        }
        resolveDispute.status = 3 // STATUS_RESOLVED
        resolveDispute.resolution = resolution
        mockStorage.set(`dispute-${resolveDisputeId}`, resolveDispute)
        return { success: true }
      case "get-dispute":
        return { success: true, value: mockStorage.get(`dispute-${args[0]}`) }
      default:
        return { success: false, error: "Method not found" }
    }
  }
  
  it("should file a dispute", () => {
    const result = mockContractCall("file-dispute", ["client1", "creator1", "Deliverable not as described"], "client1")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should start voting on a dispute", () => {
    mockContractCall("file-dispute", ["client1", "creator1", "Deliverable not as described"], "client1")
    const result = mockContractCall("start-voting", [1], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
  })
  
  it("should not allow non-owner to start voting", () => {
    mockContractCall("file-dispute", ["client1", "creator1", "Deliverable not as described"], "client1")
    const result = mockContractCall("start-voting", [1], "user1")
    expect(result.success).toBe(false)
  })
  
  it("should allow voting on a dispute", () => {
    mockContractCall("file-dispute", ["client1", "creator1", "Deliverable not as described"], "client1")
    mockContractCall("start-voting", [1], "CONTRACT_OWNER")
    const result = mockContractCall("vote-on-dispute", [1, true], "voter1")
    expect(result.success).toBe(true)
  })
  
  it("should not allow voting on a non-voting dispute", () => {
    mockContractCall("file-dispute", ["client1", "creator1", "Deliverable not as described"], "client1")
    const result = mockContractCall("vote-on-dispute", [1, true], "voter1")
    expect(result.success).toBe(false)
  })
  
  it("should resolve a dispute", () => {
    mockContractCall("file-dispute", ["client1", "creator1", "Deliverable not as described"], "client1")
    mockContractCall("start-voting", [1], "CONTRACT_OWNER")
    const result = mockContractCall("resolve-dispute", [1, "Refund 50% to client"], "CONTRACT_OWNER")
    expect(result.success).toBe(true)
  })
  
  it("should not allow non-owner to resolve a dispute", () => {
    mockContractCall("file-dispute", ["client1", "creator1", "Deliverable not as described"], "client1")
    mockContractCall("start-voting", [1], "CONTRACT_OWNER")
    const result = mockContractCall("resolve-dispute", [1, "Refund 50% to client"], "user1")
    expect(result.success).toBe(false)
  })
  
  it("should get dispute details", () => {
    mockContractCall("file-dispute", ["client1", "creator1", "Deliverable not as described"], "client1")
    const result = mockContractCall("get-dispute", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.description).toBe("Deliverable not as described")
  })
})

