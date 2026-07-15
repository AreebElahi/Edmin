import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getDepartments, 
  createDepartment, 
  updateDepartment, 
  mapCourseToDepartment,
  deleteDepartment,
  createSection,
  assignDepartmentManagers,
  CreateDepartmentPayload
} from '../api/departmentApi';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['adminDepartments'],
    queryFn: getDepartments,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDepartments'] });
      // Invalidate users or other dependent queries if necessary
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: Partial<CreateDepartmentPayload> }) => updateDepartment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDepartments'] });
    },
  });
};

export const useMapCourseToDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ deptId, courseId }: { deptId: number, courseId: number }) => mapCourseToDepartment(deptId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDepartments'] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDepartments'] });
    },
  });
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (deptId: number) => createSection(deptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDepartments'] });
    },
  });
};

export const useAssignDepartmentManagers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, hodId, supervisorId }: { id: number, hodId: number | null, supervisorId: number | null }) => 
      assignDepartmentManagers(id, hodId, supervisorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDepartments'] });
    },
  });
};

