
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Project, ProjectDocument, ProjectFile, ProjectFileKind, ProjectImage,
  ProjectPhase, ProjectResource, ProjectStatus, ProjectTeamMember
} from "@/lib/types";

// ==============================
// CREATE PROJECT
// ==============================

export async function createProject(
  supabase: SupabaseClient,
  payload: Project
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return data as Project;
}

// ==============================
// GET ALL PROJECTS
// ==============================

export async function getAllProjects(
  supabase: SupabaseClient
): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return (data ?? []) as Project[];
}

// ==============================
// GET PROJECT BY ID
// ==============================

export async function getProjectById(
  supabase: SupabaseClient,
  id: string
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  return data as Project;
}

// ==============================
// UPDATE PROJECT
// ==============================

export async function updateProject(
  supabase: SupabaseClient,
  id: string,
  payload: Project
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return data as Project;
}

// ==============================
// DELETE PROJECT
// ==============================

export async function deleteProject(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

// CREATE
export async function createProjectPhase(
  supabase: SupabaseClient,
  payload: ProjectPhase
): Promise<ProjectPhase> {
  const { data, error } = await supabase
    .from("project_phases")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectPhase;
}

// GET ALL PHASES FOR A PROJECT
export async function getProjectPhases(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectPhase[]> {
  const { data, error } = await supabase
    .from("project_phases")
    .select("*")
    .eq("project_id", projectId)
    .order("start_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as ProjectPhase[];
}

// GET PHASE BY ID
export async function getProjectPhaseById(
  supabase: SupabaseClient,
  id: string
): Promise<ProjectPhase> {
  const { data, error } = await supabase
    .from("project_phases")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectPhase;
}

// UPDATE
export async function updateProjectPhase(
  supabase: SupabaseClient,
  id: string,
  payload: ProjectPhase
): Promise<ProjectPhase> {
  const { data, error } = await supabase
    .from("project_phases")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectPhase;
}

// DELETE
export async function deleteProjectPhase(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("project_phases")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ADD TEAM MEMBER
export async function addProjectTeamMember(
  supabase: SupabaseClient,
  payload: ProjectTeamMember
): Promise<ProjectTeamMember> {
  const { data, error } = await supabase
    .from("project_team_members")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectTeamMember;
}

// GET PROJECT TEAM MEMBERS
export async function getProjectTeamMembers(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectTeamMember[]> {
  const { data, error } = await supabase
    .from("project_team_members")
    .select(`
      *,
      user:profiles (
        id,
        full_name,
        email,
        photo_url
      )
    `)
    .eq("project_id", projectId)
    .order("assigned_date", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as ProjectTeamMember[];
}

// GET TEAM MEMBER BY ID
export async function getProjectTeamMemberById(
  supabase: SupabaseClient,
  id: string
): Promise<ProjectTeamMember> {
  const { data, error } = await supabase
    .from("project_team_members")
    .select(`
      *,
      user:profiles (
        id,
        full_name,
        email,
        photo_url
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectTeamMember;
}

// UPDATE TEAM MEMBER
export async function updateProjectTeamMember(
  supabase: SupabaseClient,
  id: string,
  payload: ProjectTeamMember
): Promise<ProjectTeamMember> {
  const { data, error } = await supabase
    .from("project_team_members")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectTeamMember;
}

// REMOVE TEAM MEMBER
export async function removeProjectTeamMember(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("project_team_members")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// CREATE RESOURCE
export async function createProjectResource(
  supabase: SupabaseClient,
  payload: ProjectResource
): Promise<ProjectResource> {
  const { data, error } = await supabase
    .from("project_resources")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectResource;
}

// GET PROJECT RESOURCES
export async function getProjectResources(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectResource[]> {
  const { data, error } = await supabase
    .from("project_resources")
    .select("*")
    .eq("project_id", projectId)
    .order("used_date", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as ProjectResource[];
}

// GET RESOURCE BY ID
export async function getProjectResourceById(
  supabase: SupabaseClient,
  id: string
): Promise<ProjectResource> {
  const { data, error } = await supabase
    .from("project_resources")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectResource;
}

// UPDATE RESOURCE
export async function updateProjectResource(
  supabase: SupabaseClient,
  id: string,
  payload: ProjectResource
): Promise<ProjectResource> {
  const { data, error } = await supabase
    .from("project_resources")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectResource;
}

// DELETE RESOURCE
export async function deleteProjectResource(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("project_resources")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// REGISTER PROJECT FILE
export async function createProjectFile(
  supabase: SupabaseClient,
  payload: ProjectFile
): Promise<ProjectFile> {
  const { data, error } = await supabase
    .from("project_files")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectFile;
}

// GET ALL FILES FOR A PROJECT
export async function getProjectFiles(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("uploaded_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as ProjectFile[];
}

// GET FILE BY ID
export async function getProjectFileById(
  supabase: SupabaseClient,
  id: string
): Promise<ProjectFile> {
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectFile;
}

// UPDATE FILE DETAILS
export async function updateProjectFile(
  supabase: SupabaseClient,
  id: string,
  payload: ProjectFile
): Promise<ProjectFile> {
  const { data, error } = await supabase
    .from("project_files")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as ProjectFile;
}

// DELETE FILE RECORD
export async function deleteProjectFile(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("project_files")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}