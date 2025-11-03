@Entity
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // เช่น "ห้องประชุม 1"
    private int capacity; // ความจุ

    // --- One-to-Many ---
    // Room 1 ห้อง ถูกจองได้หลาย Booking
    @OneToMany(mappedBy = "room")
    private List<Booking> bookings;

    // Getters and Setters...
}