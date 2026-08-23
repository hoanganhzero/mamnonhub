import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  announcements,
  attendance,
  campuses,
  childGuardians,
  children,
  classes,
  dailyLogs,
  feeSettings,
  menus,
  schools,
  users,
} from "../../../db/schema";
import { logAction } from "../../../lib/audit";
import { hashPassword, makeSalt } from "../../../lib/password";
import { vnToday } from "../../../lib/day";
import { currentUser } from "../../../lib/session";
import { weekStartOf } from "../../../lib/week";

const DEMO_PASSWORD = "DemoMamNon@123";
const TEACHERS = ["Nguyễn Minh Thư", "Trần Thu Hà"];
const PARENTS = [
  "Phạm Văn Bình",
  "Lê Thị Hồng",
  "Vũ Đức Long",
  "Đỗ Thu Trang",
  "Hoàng Anh Tuấn",
];
const KIDS = [
  "Nguyễn Gia Hân", "Trần Minh Khang", "Lê Bảo Ngọc", "Phạm Đức Anh",
  "Vũ Hà My", "Đỗ Quang Huy", "Hoàng Khánh Chi", "Bùi Nhật Minh",
  "Đặng Thảo Vy", "Ngô Tuấn Kiệt", "Dương Ngọc Ánh", "Lý Gia Bảo",
  "Trịnh Mai Anh", "Phan Hữu Phước", "Võ Thanh Trúc", "Tạ Duy Khánh",
  "Lưu Hải Đăng", "Mai Diệu Linh", "Chu Việt Hoàng", "Đinh Tuệ Nhi",
];
const ALLERGIES = ["Không", "Không", "Không", "Tôm", "Sữa bò", "Không", "Trứng"];

/** Tạo một trường demo đầy đủ dữ liệu để bấm thử toàn bộ luồng. */
export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    if (user?.role !== "superadmin")
      return Response.json(
        { error: "Chỉ quản trị tối cao được tạo dữ liệu demo" },
        { status: 403 },
      );
    const db = getDb();
    const existing = await db
      .select()
      .from(schools)
      .where(eq(schools.code, "DEMO"))
      .limit(1);
    if (existing.length)
      return Response.json(
        { error: "Trường DEMO đã tồn tại. Xóa hoặc dùng trường đó để thử." },
        { status: 409 },
      );

    const [school] = await db
      .insert(schools)
      .values({
        code: "DEMO",
        name: "Mầm Non Demo",
        academicYear: "2026–2027",
        address: "123 Đường Thử Nghiệm, Quận 1",
      })
      .returning();
    const [campus] = await db
      .insert(campuses)
      .values({ schoolId: school.id, name: "Cơ sở chính" })
      .returning();

    const account = async (
      username: string,
      fullName: string,
      role: string,
    ) => {
      const salt = makeSalt();
      const [row] = await db
        .insert(users)
        .values({
          schoolId: school.id,
          username,
          fullName,
          passwordHash: await hashPassword(DEMO_PASSWORD, salt),
          salt,
          role,
          status: "active",
        })
        .returning();
      return row;
    };

    const admin = await account("qt.demo", "Quản Trị Demo", "admin");
    const teacherRows = [];
    for (let i = 0; i < TEACHERS.length; i++)
      teacherRows.push(await account(`gv.demo${i + 1}`, TEACHERS[i], "teacher"));
    const parentRows = [];
    for (let i = 0; i < PARENTS.length; i++)
      parentRows.push(await account(`ph.demo${i + 1}`, PARENTS[i], "parent"));

    const classRows = [];
    for (const [index, name] of [
      ["Chồi 1", "3–4 tuổi"],
      ["Lá 1", "5–6 tuổi"],
    ].entries())
      classRows.push(
        (
          await db
            .insert(classes)
            .values({
              schoolId: school.id,
              campusId: campus.id,
              name: name[0],
              ageGroup: name[1],
              academicYear: school.academicYear,
              teacherId: teacherRows[index].id,
              motto:
                index === 0
                  ? "Chồi 1 bé ngoan, cô yêu cả lớp"
                  : "Lá 1 chăm ngoan – học giỏi – vui khỏe",
            })
            .returning()
        )[0],
      );

    const today = vnToday();
    const childRows = [];
    for (let i = 0; i < KIDS.length; i++) {
      const cls = classRows[i % 2];
      const parent = i < 5 ? parentRows[i] : null;
      const [child] = await db
        .insert(children)
        .values({
          schoolId: school.id,
          name: KIDS[i],
          classId: cls.id,
          className: cls.name,
          birthDate: `${2021 + (i % 2)}-0${(i % 9) + 1}-1${i % 9}`,
          guardian: parent?.fullName || "",
          allergy: ALLERGIES[i % ALLERGIES.length],
          status: "Đang học",
          parentUserId: parent?.id ?? null,
        })
        .returning();
      childRows.push(child);
      if (parent)
        await db.insert(childGuardians).values({
          childId: child.id,
          userId: parent.id,
          relation: "Bố",
          isPrimary: true,
        });
    }

    // Điểm danh + sổ chăm sóc hôm nay cho khoảng 2/3 số trẻ.
    for (const [i, child] of childRows.entries()) {
      if (i % 3 === 2) continue;
      await db.insert(attendance).values({
        schoolId: school.id,
        childId: child.id,
        classId: child.classId,
        date: today,
        status: i % 7 === 3 ? "Vắng có phép" : "Có mặt",
        checkInAt: i % 7 === 3 ? "" : `07:${String(10 + (i % 40)).padStart(2, "0")}`,
        recordedBy: teacherRows[i % 2].id,
      });
      await db.insert(dailyLogs).values({
        schoolId: school.id,
        childId: child.id,
        classId: child.classId,
        date: today,
        breakfast: "Ăn hết",
        lunch: i % 4 === 1 ? "Nửa suất" : "Ăn hết",
        snack: "Ăn hết",
        sleep: "Ngủ ngon",
        sleepMinutes: 90 + (i % 4) * 10,
        mood: "Vui vẻ",
        health: "Bình thường",
        note: i % 5 === 0 ? "Con kể chuyện rất hăng hái" : "",
        recordedBy: teacherRows[i % 2].id,
      });
    }

    const week = weekStartOf(today);
    const dishes = [
      ["Cháo thịt bằm", "Cơm · Cá sốt cà · Canh rau ngót", "Sữa chua · Chuối"],
      ["Bún thịt rau củ", "Cơm · Thịt kho trứng · Canh bí", "Bánh flan"],
      ["Phở gà", "Cơm · Tôm rim · Canh cải", "Sữa tươi · Táo"],
      ["Cháo sườn", "Cơm · Gà xé · Canh mồng tơi", "Chè đậu xanh"],
      ["Mì trứng", "Cơm · Bò xào · Canh chua", "Sữa chua · Dưa hấu"],
    ];
    for (let d = 1; d <= 5; d++)
      await db.insert(menus).values({
        schoolId: school.id,
        weekStart: week,
        weekday: d,
        breakfast: dishes[d - 1][0],
        lunch: dishes[d - 1][1],
        snack: dishes[d - 1][2],
        updatedBy: admin.id,
      });

    await db.insert(feeSettings).values({
      schoolId: school.id,
      tuitionMonthly: 1500000,
      mealPerDay: 35000,
      otherFee: 100000,
      otherLabel: "Phí vệ sinh",
      bankCode: "VCB",
      bankAccount: "0123456789",
      bankHolder: "TRUONG MAM NON DEMO",
    });
    await db.insert(announcements).values({
      schoolId: school.id,
      title: "Chào mừng đến với trường demo",
      content:
        "Đây là dữ liệu thử nghiệm. Đăng nhập giáo viên bằng gv.demo1, phụ huynh bằng ph.demo1 để trải nghiệm toàn bộ luồng.",
      audience: "Toàn trường",
      createdBy: admin.id,
    });

    await logAction(user, "tạo", "dữ liệu demo", school.id, "trường DEMO");
    return Response.json(
      {
        ok: true,
        school: { id: school.id, code: school.code, name: school.name },
        accounts: {
          admin: "qt.demo",
          teachers: teacherRows.map((x) => x.username),
          parents: parentRows.map((x) => x.username),
          password: DEMO_PASSWORD,
        },
        children: childRows.length,
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
