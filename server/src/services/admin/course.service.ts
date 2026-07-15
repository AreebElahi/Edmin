import prisma from '../../config/prisma.js';


export const getAllCourses = async () => {
    return prisma.course.findMany({
        where: {
            isactive: true
        },
        include: {
            departmentcourse: {
                include: {
                    department: true
                }
            }
        },
        orderBy: {
            createdat: 'desc'
        }
    });
};

export const createCourse = async (data: {
    code: string;
    name: string;
    credits: number;
    basecapacity: number;
    description?: string;
    departmentIds: number[];
}) => {
    return prisma.$transaction(async (tx) => {
        // Create course
        const newCourse = await tx.course.create({
            data: {
                code: data.code,
                name: data.name,
                credits: data.credits,
                basecapacity: data.basecapacity,
                description: data.description,
            }
        });

        // Create departmentcourse mappings
        if (data.departmentIds && data.departmentIds.length > 0) {
            const mappings = data.departmentIds.map((id) => ({
                courseid: newCourse.courseid,
                departmentid: id
            }));
            
            await tx.departmentcourse.createMany({
                data: mappings
            });
        }

        return tx.course.findUnique({
            where: { courseid: newCourse.courseid },
            include: {
                departmentcourse: {
                    include: { department: true }
                }
            }
        });
    });
};

export const updateCourse = async (
    courseid: number,
    data: {
        code: string;
        name: string;
        credits: number;
        basecapacity: number;
        description?: string;
        departmentIds: number[];
    }
) => {
    return prisma.$transaction(async (tx) => {
        const updatedCourse = await tx.course.update({
            where: { courseid },
            data: {
                code: data.code,
                name: data.name,
                credits: data.credits,
                basecapacity: data.basecapacity,
                description: data.description,
                updatedat: new Date()
            }
        });

        // Sync department mappings
        if (data.departmentIds) {
            // Delete existing
            await tx.departmentcourse.deleteMany({
                where: { courseid }
            });

            // Insert new mappings
            if (data.departmentIds.length > 0) {
                const mappings = data.departmentIds.map((id) => ({
                    courseid,
                    departmentid: id
                }));
                
                await tx.departmentcourse.createMany({
                    data: mappings
                });
            }
        }

        return tx.course.findUnique({
            where: { courseid },
            include: {
                departmentcourse: {
                    include: { department: true }
                }
            }
        });
    });
};

export const toggleCourseStatus = async (courseid: number, isactive: boolean) => {
    return prisma.course.update({
        where: { courseid },
        data: {
            isactive,
            updatedat: new Date()
        }
    });
};
