import { describe, it, expect, beforeEach } from "vitest"

describe("Content Creator", () => {
  let mockStorage: Map<string, any>
  let creatorNonce: number
  
  beforeEach(() => {
    mockStorage = new Map()
    creatorNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "register-creator":
        const [name, bio] = args
        creatorNonce++
        mockStorage.set(`creator-${creatorNonce}`, {
          owner: sender,
          name,
          bio,
        })
        return { success: true, value: creatorNonce }
      case "update-profile":
        const [creatorId, newName, newBio] = args
        const creator = mockStorage.get(`creator-${creatorId}`)
        if (!creator || creator.owner !== sender) return { success: false, error: "Not authorized" }
        creator.name = newName
        creator.bio = newBio
        mockStorage.set(`creator-${creatorId}`, creator)
        return { success: true }
      case "get-creator-profile":
        return { success: true, value: mockStorage.get(`creator-${args[0]}`) }
      default:
        return { success: false, error: "Method not found" }
    }
  }
  
  it("should register a creator", () => {
    const result = mockContractCall("register-creator", ["Alice", "Freelance writer"], "alice")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should update a creator's profile", () => {
    mockContractCall("register-creator", ["Alice", "Freelance writer"], "alice")
    const result = mockContractCall("update-profile", [1, "Alice Smith", "Experienced freelance writer"], "alice")
    expect(result.success).toBe(true)
  })
  
  it("should not update another creator's profile", () => {
    mockContractCall("register-creator", ["Alice", "Freelance writer"], "alice")
    const result = mockContractCall("update-profile", [1, "Bob", "Hacker"], "bob")
    expect(result.success).toBe(false)
  })
  
  it("should get a creator's profile", () => {
    mockContractCall("register-creator", ["Alice", "Freelance writer"], "alice")
    const result = mockContractCall("get-creator-profile", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.name).toBe("Alice")
    expect(result.value.bio).toBe("Freelance writer")
  })
})

